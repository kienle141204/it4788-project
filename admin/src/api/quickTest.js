// Simple test to verify API functions work
import { 
  fetchDishes,
  fetchIngredients,
  fetchRecipes,
  fetchMenus,
  fetchFamilies,
  fetchDishReviews
} from './index';


// Test basic API calls that don't require specific IDs or complex data
async function runTests() {
  try {
    const dishes = await fetchDishes({ page: 1, limit: 3 });
  } catch (error) {
  }

  try {
    const ingredients = await fetchIngredients({ page: 1, limit: 3 });
  } catch (error) {
  }

  try {
    const recipes = await fetchRecipes({ page: 1, limit: 3 });
  } catch (error) {
  }

  try {
    const menus = await fetchMenus({ page: 1, limit: 3 });
  } catch (error) {
  }

  try {
    const families = await fetchFamilies({ page: 1, limit: 3 });
  } catch (error) {
  }

  try {
    // Try to fetch reviews for dish ID 1 (if it exists)
    const reviews = await fetchDishReviews(1);
  } catch (error) {
  }

}

runTests().catch(console.error);
