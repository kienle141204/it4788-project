// Main API index file - exports all API services
export { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  searchUsers,
  getUserById
} from './userAPI';

export { 
  fetchDishes, 
  createDish, 
  updateDish, 
  deleteDish, 
  searchDishes,
  getDishById
} from './dishAPI';

export { 
  fetchFoods, 
  createFood, 
  updateFood, 
  deleteFood, 
  searchFoods,
  getFoodById
} from './foodAPI';

export { 
  fetchRecipes, 
  createRecipe, 
  updateRecipe, 
  deleteRecipe, 
  searchRecipes,
  getRecipeById
} from './recipeAPI';

export { useApi, apiService } from './hooks';