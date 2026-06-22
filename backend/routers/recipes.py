"""菜谱相关路由"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from database import get_db
from models import (
    RecipeBrief, RecipeDetail, RecipeListResponse,
    MatchItem, MatchResponse, Ingredient, Step, Category
)

router = APIRouter(prefix="/api/recipes", tags=["recipes"])

SORT_COLUMNS = {'view_count', 'fav_count', 'cook_count', 'grade', 'id'}


def row_to_brief(row) -> RecipeBrief:
    return RecipeBrief(
        id=row["id"],
        title=row["title"],
        thumb=row["thumb"],
        difficulty=row["difficulty"],
        difficulty_label=row["difficulty_label"],
        cost_time=row["cost_time"],
        main_category=row["main_category"],
        view_count=row["view_count"],
        fav_count=row["fav_count"],
        cook_count=row["cook_count"],
        grade=row["grade"],
        video_platform=row["video_platform"],
    )


@router.get("", response_model=RecipeListResponse)
def list_recipes(
    keyword: Optional[str] = Query(None, description="关键词搜索 title/description"),
    difficulty: Optional[int] = Query(None, description="难度 0/1/2/3"),
    cost_time: Optional[str] = Query(None, description="耗时分档"),
    category: Optional[str] = Query(None, description="分类名"),
    sort: str = Query("view_count", description="排序字段"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    """菜谱列表/搜索"""
    if sort not in SORT_COLUMNS:
        sort = "view_count"

    where_parts = []
    params = []
    if keyword:
        where_parts.append("(title LIKE ? OR description LIKE ?)")
        params.extend([f"%{keyword}%", f"%{keyword}%"])
    if difficulty is not None:
        where_parts.append("difficulty = ?")
        params.append(difficulty)
    if cost_time:
        where_parts.append("cost_time = ?")
        params.append(cost_time)
    if category:
        where_parts.append(
            "id IN (SELECT recipe_id FROM recipe_categories WHERE category = ?)"
        )
        params.append(category)

    where_sql = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""

    with get_db() as conn:
        # 总数
        count_sql = f"SELECT COUNT(*) FROM recipes{where_sql}"
        total = conn.execute(count_sql, params).fetchone()[0]

        # 分页查询
        offset = (page - 1) * page_size
        # 排序字段可能为 NULL，用 COALESCE 兜底
        order_sql = f"ORDER BY COALESCE({sort}, 0) DESC, id ASC LIMIT ? OFFSET ?"
        query_sql = f"SELECT * FROM recipes{where_sql} {order_sql}"
        rows = conn.execute(query_sql, params + [page_size, offset]).fetchall()

    items = [row_to_brief(r) for r in rows]
    return RecipeListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/random", response_model=RecipeBrief)
def random_recipe():
    """随机返回一道菜谱"""
    import random
    with get_db() as conn:
        # 先取总数
        total = conn.execute("SELECT COUNT(*) FROM recipes").fetchone()[0]
        if total == 0:
            raise HTTPException(status_code=404, detail="暂无菜谱")
        # 随机偏移取一条
        offset = random.randint(0, total - 1)
        row = conn.execute(
            "SELECT * FROM recipes LIMIT 1 OFFSET ?", (offset,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="未找到菜谱")
    return row_to_brief(row)


@router.get("/match", response_model=MatchResponse)
def match_recipes(
    ingredient_ids: str = Query(..., description="逗号分隔的食材 ID"),
    limit: int = Query(50, ge=1, le=200),
):
    """冰箱模式：按食材匹配菜谱"""
    try:
        ids = [int(x.strip()) for x in ingredient_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="ingredient_ids 格式错误")
    if not ids:
        raise HTTPException(status_code=400, detail="至少提供一个食材 ID")

    placeholders = ",".join("?" * len(ids))

    with get_db() as conn:
        # 查询每个菜谱匹配的食材数和总食材数
        matched_rows = conn.execute(
            f"""
            SELECT recipe_id, COUNT(*) AS matched
            FROM recipe_ingredients
            WHERE ingredient_id IN ({placeholders})
            GROUP BY recipe_id
            """,
            ids,
        ).fetchall()

        if not matched_rows:
            return MatchResponse(items=[], total=0)

        recipe_ids = [r["recipe_id"] for r in matched_rows]
        matched_map = {r["recipe_id"]: r["matched"] for r in matched_rows}

        # 查每个菜谱的总食材数
        total_rows = conn.execute(
            f"""
            SELECT recipe_id, COUNT(*) AS total
            FROM recipe_ingredients
            WHERE recipe_id IN ({",".join("?" * len(recipe_ids))})
            GROUP BY recipe_id
            """,
            recipe_ids,
        ).fetchall()
        total_map = {r["recipe_id"]: r["total"] for r in total_rows}

        # 查菜谱主信息
        recipe_rows = conn.execute(
            f"""
            SELECT * FROM recipes
            WHERE id IN ({",".join("?" * len(recipe_ids))})
            """,
            recipe_ids,
        ).fetchall()
        recipe_map = {r["id"]: r for r in recipe_rows}

    items = []
    for rid, matched in matched_map.items():
        total_count = total_map.get(rid, 0)
        if total_count == 0:
            continue
        ratio = matched / total_count
        row = recipe_map.get(rid)
        if row is None:
            continue
        items.append(MatchItem(
            recipe=row_to_brief(row),
            match_ratio=round(ratio, 4),
            matched_count=matched,
            total_count=total_count,
        ))

    # 按匹配度降序，再按匹配数降序
    items.sort(key=lambda x: (-x.match_ratio, -x.matched_count))
    items = items[:limit]
    return MatchResponse(items=items, total=len(items))


@router.get("/{recipe_id}", response_model=RecipeDetail)
def get_recipe(recipe_id: int):
    """菜谱详情"""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="菜谱不存在")

        ingredients = conn.execute(
            """
            SELECT ri.ingredient_id AS id, i.name, ri.amount
            FROM recipe_ingredients ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?
            ORDER BY ri.sort_order
            """,
            (recipe_id,),
        ).fetchall()

        steps = conn.execute(
            "SELECT id, step_num, step_text, step_pic FROM recipe_steps WHERE recipe_id = ? ORDER BY step_num",
            (recipe_id,),
        ).fetchall()

        categories = conn.execute(
            "SELECT category, is_main FROM recipe_categories WHERE recipe_id = ?",
            (recipe_id,),
        ).fetchall()

    detail = RecipeDetail(
        id=row["id"],
        did=row["did"],
        title=row["title"],
        thumb=row["thumb"],
        video_url=row["video_url"],
        video_platform=row["video_platform"],
        description=row["description"],
        difficulty=row["difficulty"],
        difficulty_label=row["difficulty_label"],
        cost_time=row["cost_time"],
        tip=row["tip"],
        main_category=row["main_category"],
        grade=row["grade"],
        cook_count=row["cook_count"],
        view_count=row["view_count"],
        fav_count=row["fav_count"],
        ingredients=[Ingredient(id=i["id"], name=i["name"], amount=i["amount"]) for i in ingredients],
        steps=[Step(id=s["id"], step_num=s["step_num"], step_text=s["step_text"], step_pic=s["step_pic"]) for s in steps],
        categories=[Category(category=c["category"], is_main=c["is_main"]) for c in categories],
    )
    return detail
