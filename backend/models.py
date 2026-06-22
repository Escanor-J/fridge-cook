"""Pydantic 响应模型"""
from typing import Optional, List
from pydantic import BaseModel


class RecipeBrief(BaseModel):
    id: int
    title: str
    thumb: Optional[str] = None
    difficulty: Optional[int] = None
    difficulty_label: Optional[str] = None
    cost_time: Optional[str] = None
    main_category: Optional[str] = None
    view_count: Optional[int] = None
    fav_count: Optional[int] = None
    cook_count: Optional[int] = None
    grade: Optional[float] = None
    video_platform: Optional[str] = None


class Ingredient(BaseModel):
    id: int
    name: str
    amount: Optional[str] = None


class Step(BaseModel):
    id: int
    step_num: int
    step_text: Optional[str] = None
    step_pic: Optional[str] = None


class Category(BaseModel):
    category: str
    is_main: int = 0


class RecipeDetail(RecipeBrief):
    did: Optional[str] = None
    video_url: Optional[str] = None
    description: Optional[str] = None
    tip: Optional[str] = None
    ingredients: List[Ingredient] = []
    steps: List[Step] = []
    categories: List[Category] = []


class RecipeListResponse(BaseModel):
    items: List[RecipeBrief]
    total: int
    page: int
    page_size: int


class MatchItem(BaseModel):
    recipe: RecipeBrief
    match_ratio: float
    matched_count: int
    total_count: int


class MatchResponse(BaseModel):
    items: List[MatchItem]
    total: int


class IngredientItem(BaseModel):
    id: int
    name: str
    count: int
    category: Optional[str] = None


class CategoryItem(BaseModel):
    category: str
    count: int
    is_main: int
