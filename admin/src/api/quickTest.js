// Simple test to verify API functions work
import { 
  fetchDishes,
  fetchIngredients,
  fetchRecipes,
  fetchMenus,
  fetchFamilies,
  fetchDishReviews
} from './index';

console.log('Testing API connections...');

// Test basic API calls that don't require specific IDs or complex data
async function runTests() {
  console.log('1. Testing fetchDishes...');
  try {
    const dishes = await fetchDishes({ page: 1, limit: 3 });
    console.log('✅ fetchDishes successful:', dishes && dishes.data ? dishes.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchDishes failed:', error.message);
  }

  console.log('\n2. Testing fetchIngredients...');
  try {
    const ingredients = await fetchIngredients({ page: 1, limit: 3 });
    console.log('✅ fetchIngredients successful:', ingredients && ingredients.data ? ingredients.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchIngredients failed:', error.message);
  }

  console.log('\n3. Testing fetchRecipes...');
  try {
    const recipes = await fetchRecipes({ page: 1, limit: 3 });
    console.log('✅ fetchRecipes successful:', recipes && recipes.data ? recipes.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchRecipes failed:', error.message);
  }

  console.log('\n4. Testing fetchMenus...');
  try {
    const menus = await fetchMenus({ page: 1, limit: 3 });
    console.log('✅ fetchMenus successful:', menus && menus.data ? menus.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchMenus failed:', error.message);
  }

  console.log('\n5. Testing fetchFamilies...');
  try {
    const families = await fetchFamilies({ page: 1, limit: 3 });
    console.log('✅ fetchFamilies successful:', families && families.data ? families.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchFamilies failed:', error.message);
  }

  console.log('\n6. Testing fetchDishReviews...');
  try {
    // Try to fetch reviews for dish ID 1 (if it exists)
    const reviews = await fetchDishReviews(1);
    console.log('✅ fetchDishReviews successful:', reviews && reviews.data ? reviews.data.length : 'no data');
  } catch (error) {
    console.log('❌ fetchDishReviews failed:', error.message);
  }

  console.log('\n🎯 Basic API tests completed!');
}

runTests().catch(console.error);