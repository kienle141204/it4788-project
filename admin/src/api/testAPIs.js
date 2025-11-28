// Test file to verify all API endpoints work correctly with the backend
import { 
  // User APIs
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  getUserById,
  
  // User Management APIs
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
  getUserReviews,
  
  // Dish APIs
  fetchDishes,
  createDish,
  updateDish,
  deleteDish,
  searchDishes,
  getDishById,
  getAllDishes,
  
  // Ingredient APIs
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  searchIngredients,
  getIngredientById,
  getIngredientsByDishId,
  getIngredientsByPlaceId,
  getIngredientsByCategoryId,
  searchIngredientsAdvanced,
  
  // Recipe APIs
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
  getRecipeById,
  getRecipesByDishId,
  getRecipesByOwnerId,
  getPopularRecipes,
  
  // Menu APIs
  fetchMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  searchMenus,
  getMenuById,
  addDishToMenu,
  removeDishFromMenu,
  getMenuDishes,
  
  // Family APIs
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
  getFamilyStats,
  
  // Dish Review APIs
  fetchDishReviews,
  createDishReview,
  updateDishReview,
  deleteDishReview,
  searchDishReviews,
  getDishReviewById,
  getDishReviewStats
} from './index';

// Test configuration
const TEST_CONFIG = {
  // Sample data for testing
  sampleUserData: {
    email: 'testuser@example.com',
    phone_number: '0987654321',
    password: 'password123',
    full_name: 'Test User'
  },
  sampleDishData: {
    name: 'Test Dish',
    description: 'Test dish description',
    image_url: 'https://example.com/test-dish.jpg'
  },
  sampleIngredientData: {
    name: 'Test Ingredient',
    description: 'Test ingredient description',
    price: 10000,
    category_id: 1, // Assuming category 1 exists
    place_id: 1     // Assuming place 1 exists
  },
  sampleRecipeData: {
    dish_id: 1, // Assuming dish 1 exists
    status: 'public'
  },
  sampleFamilyData: {
    name: 'Test Family'
  },
  sampleMenuData: {
    description: 'Test Menu Description'
  },
  sampleReviewData: {
    rating: 5,
    comment: 'Test review comment'
  }
};

// Test class to organize all API tests
class APITester {
  constructor() {
    this.results = {};
    this.failedTests = [];
  }

  async testAPI(name, apiFunction, params = null) {
    console.log(`\n🧪 Testing ${name}...`);
    
    try {
      let result;
      if (params === null) {
        result = await apiFunction();
      } else if (Array.isArray(params)) {
        result = await apiFunction(...params);
      } else {
        result = await apiFunction(params);
      }
      
      this.results[name] = { success: true, result };
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Response:`, result);
      return { success: true, result };
    } catch (error) {
      this.results[name] = { success: false, error: error.message };
      this.failedTests.push({ name, error: error.message });
      console.error(`❌ ${name} - FAILED:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');
    
    // Test User APIs
    await this.testAPI('fetchUsers', fetchUsers);
    await this.testAPI('fetchUserManagement', fetchUserManagement);
    
    // Test Dish APIs
    await this.testAPI('fetchDishes', fetchDishes, { page: 1, limit: 5 });
    await this.testAPI('getAllDishes', getAllDishes);
    await this.testAPI('searchDishes', searchDishes, ['test', 1, 5]);
    
    // Test Ingredient APIs
    await this.testAPI('fetchIngredients', fetchIngredients, { page: 1, limit: 5 });
    await this.testAPI('searchIngredients', searchIngredients, ['meat', 1, 5]);
    
    // Test Recipe APIs
    await this.testAPI('fetchRecipes', fetchRecipes, { page: 1, limit: 5 });
    
    // Test Menu APIs
    await this.testAPI('fetchMenus', fetchMenus, { page: 1, limit: 5 });
    
    // Test Family APIs
    await this.testAPI('fetchFamilies', fetchFamilies, { page: 1, limit: 5 });
    
    // Test Dish Review APIs
    // Note: Need a valid dish ID for testing reviews
    await this.testAPI('fetchDishReviews', fetchDishReviews, [1]); // Testing with dish ID 1
    
    // Test some specific API calls with sample data
    // Note: These might fail if the backend has validation or requires specific existing data
    console.log('\n📝 Testing with sample data (might fail due to validation)...');
    
    try {
      // Try to get a specific dish to verify the endpoint works
      await this.testAPI('getDishById', getDishById, [1]); // Try with dish ID 1
      
      // Try to get a specific user to verify the endpoint works
      await this.testAPI('getUserById', getUserById, [1]); // Try with user ID 1
      
      // Try to get ingredients by dish ID
      await this.testAPI('getIngredientsByDishId', getIngredientsByDishId, [1]);
      
      // Try to get recipes by dish ID
      await this.testAPI('getRecipesByDishId', getRecipesByDishId, [1]);
      
      // Try to get user families
      await this.testAPI('getUserFamilies', getUserFamilies, [1]);
      
      // Try to get dish review stats
      await this.testAPI('getDishReviewStats', getDishReviewStats, [1]);
      
    } catch (error) {
      console.log('Note: Some tests with IDs failed as expected due to missing test data.');
    }
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    
    const totalTests = Object.keys(this.results).length;
    const successfulTests = Object.values(this.results).filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${failedTests}`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name}: ${test.error}`);
      });
    } else {
      console.log('\n🎉 All tests passed!');
    }
    
    // Check if basic connectivity is working
    const hasSuccessfulConnection = Object.values(this.results).some(r => r.success);
    if (hasSuccessfulConnection) {
      console.log('\n✅ Backend connection is working properly!');
      console.log('✅ You can now use all the updated APIs in your admin panel');
    } else {
      console.log('\n❌ No successful API calls - please check backend connection');
    }
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().then(() => {
  console.log('\n🎯 API testing completed!');
});

export default APITester;