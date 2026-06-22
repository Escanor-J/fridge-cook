import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 15000,
})

export async function fetchRecipes(params = {}) {
  const { data } = await api.get('/recipes', { params })
  return data
}

export async function fetchRandomRecipe() {
  const { data } = await api.get('/recipes/random')
  return data
}

export async function fetchRecipeDetail(id) {
  const { data } = await api.get(`/recipes/${id}`)
  return data
}

export async function matchRecipes(ingredientIds, limit = 50) {
  const { data } = await api.get('/recipes/match', {
    params: { ingredient_ids: ingredientIds.join(','), limit },
  })
  return data
}

export async function fetchIngredients(keyword = '', limit = 500) {
  const { data } = await api.get('/ingredients', { params: { keyword, limit } })
  return data
}

export async function fetchCategories() {
  const { data } = await api.get('/categories')
  return data
}
