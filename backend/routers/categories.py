"""分类列表路由"""
import os
import json
from fastapi import APIRouter
from models import CategoryItem

router = APIRouter(prefix="/api/categories", tags=["categories"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JSON_PATH = os.path.join(BASE_DIR, 'data', 'categories_list.json')

_cache = None


def load_categories():
    global _cache
    if _cache is None:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            _cache = json.load(f)
    return _cache


@router.get("", response_model=list[CategoryItem])
def list_categories():
    """分类列表（按数量降序）"""
    return load_categories()
