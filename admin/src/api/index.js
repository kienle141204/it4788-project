// Main API index file - exports all API services
// Basic user API
export {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  getUserById
} from './userAPI';

// Advanced user management API for admin
export {
  fetchUserManagement,
  createUserManagement,
  updateUserManagement,
  deleteUserManagement,
  searchUsersManagement,
  getUserManagementById,
  updateUserRole,
  getUserStats,
  getUserFamilies,
  getUserRecipes,
  getUserReviews
} from './userManagementAPI';

// Dish API
export {
  fetchDishes,
  createDish,
  updateDish,
  deleteDish,
  searchDishes,
  getDishById,
  getAllDishes
} from './dishAPI';

// Ingredient API
export {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  searchIngredients,
  getIngredientById,
  getIngredientsByDishId,
  getIngredientsByPlaceId,
  getIngredientsByCategoryId,
  searchIngredientsAdvanced
} from './ingredientAPI';

// Recipe API
export {
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
  getRecipeById,
  getRecipesByDishId,
  getRecipesByOwnerId,
  getPopularRecipes
} from './recipeAPI';

// Menu API
export {
  fetchMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  searchMenus,
  getMenuById,
  addDishToMenu,
  removeDishFromMenu,
  getMenuDishes
} from './menuAPI';

// Family API
export {
  fetchFamilies,
  createFamily,
  updateFamily,
  deleteFamily,
  searchFamilies,
  getFamilyById,
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  getFamilyMenus,
  getFamilyStats
} from './familyAPI';

// Dish Review API
export {
  fetchDishReviews,
  createDishReview,
  updateDishReview,
  deleteDishReview,
  searchDishReviews,
  getDishReviewById,
  getDishReviewStats
} from './dishReviewAPI';

export { useApi, apiService } from './hooks';