"""食材列表路由"""
import os
import json
from typing import Optional
from fastapi import APIRouter, Query
from models import IngredientItem

router = APIRouter(prefix="/api/ingredients", tags=["ingredients"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JSON_PATH = os.path.join(BASE_DIR, 'data', 'ingredients_list.json')

_cache = None


def load_ingredients():
    global _cache
    if _cache is None:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            _cache = json.load(f)
    return _cache


@router.get("", response_model=list[IngredientItem])
def list_ingredients(
    keyword: Optional[str] = Query(None, description="按名称过滤"),
    limit: int = Query(500, ge=1, le=5000),
):
    """食材列表（按频次降序）"""
    data = load_ingredients()
    if keyword:
        kw = keyword.strip()
        data = [x for x in data if kw in x["name"]]
    return data[:limit]
