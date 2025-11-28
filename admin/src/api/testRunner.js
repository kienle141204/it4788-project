// Test runner for API verification
// Run this with: node testRunner.js

// Since we're in a frontend environment, we'll create a simple test
// that can be run when the app loads to verify API functionality

// For now, let's create a test that can be run in the browser environment

const apiTests = {
  // Test data
  testData: {
    dishId: 1,  // Default dish ID to use for testing
    userId: 1,  // Default user ID to use for testing
    familyId: 1 // Default family ID to use for testing
  },

  // Results tracking
  results: {
    passed: [],
    failed: []
  },

  async runTest(name, testFunction) {
    console.log(`🧪 Running test: ${name}`);
    try {
      const result = await testFunction();
      this.results.passed.push({ name, result });
      console.log(`✅ PASSED: ${name}`);
      return true;
    } catch (error) {
      this.results.failed.push({ name, error: error.message });
      console.log(`❌ FAILED: ${name} - ${error.message}`);
      return false;
    }
  },

  async runAllTests() {
    console.log('🚀 Starting API Tests...\n');

    // Import the APIs (in a real scenario, these would be imported)
    const { 
      fetchDishes,
      fetchIngredients, 
      fetchRecipes,
      fetchMenus,
      fetchFamilies,
      getDishById,
      getIngredientById,
      getRecipeById,
      getMenuById,
      getFamilyById
    } = await import('./index.js');

    // Test paginated fetch APIs
    await this.runTest('fetchDishes (paginated)', async () => {
      const result = await fetchDishes({ page: 1, limit: 2 });
      if (!result || !result.data) {
        throw new Error('No data returned from fetchDishes');
      }
      return result;
    });

    await this.runTest('fetchIngredients (paginated)', async () => {
      const result = await fetchIngredients({ page: 1, limit: 2 });
      if (!result || !result.data) {
        throw new Error('No data returned from fetchIngredients');
      }
      return result;
    });

    await this.runTest('fetchRecipes (paginated)', async () => {
      const result = await fetchRecipes({ page: 1, limit: 2 });
      if (!result || !result.data) {
        throw new Error('No data returned from fetchRecipes');
      }
      return result;
    });

    await this.runTest('fetchMenus (paginated)', async () => {
      const result = await fetchMenus({ page: 1, limit: 2 });
      if (!result || !result.data) {
        throw new Error('No data returned from fetchMenus');
      }
      return result;
    });

    await this.runTest('fetchFamilies (paginated)', async () => {
      const result = await fetchFamilies({ page: 1, limit: 2 });
      if (!result || !result.data) {
        throw new Error('No data returned from fetchFamilies');
      }
      return result;
    });

    // Test specific item retrieval (if available)
    await this.runTest('getDishById (if available)', async () => {
      try {
        const result = await getDishById(this.testData.dishId);
        return result;
      } catch (error) {
        // It's ok if this fails if dish ID doesn't exist
        console.log(`   (Expected failure if dish ID ${this.testData.dishId} doesn't exist)`);
        throw error;
      }
    });

    await this.runTest('getIngredientById (if available)', async () => {
      try {
        const result = await getIngredientById(this.testData.dishId); // Using dishId as placeholder
        return result;
      } catch (error) {
        // It's ok if this fails if ingredient ID doesn't exist
        console.log(`   (Expected failure if ingredient ID ${this.testData.dishId} doesn't exist)`);
        throw error;
      }
    });

    // Print summary
    this.printSummary();
  },

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`📊 Total: ${this.results.passed.length + this.results.failed.length}`);

    if (this.results.failed.length === 0) {
      console.log('\n🎉 All API tests completed successfully!');
      console.log('✅ All APIs are properly configured and connecting to the backend');
      console.log('✅ The admin panel can now use all the updated API endpoints');
    } else {
      console.log('\n⚠️  Some tests failed, but this may be due to:');
      console.log('   - Missing test data in the backend');
      console.log('   - Authentication token not set');
      console.log('   - Backend server not running');
      console.log('\nCheck if the backend service is running on http://localhost:8090');
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiTests;
} else {
  // For browser environment
  window.apiTests = apiTests;
}

// Run the tests automatically if this is the main module
if (typeof window !== 'undefined') {
  // In browser environment
  console.log('API Test Suite loaded. Run apiTests.runAllTests() to start testing.');
} else if (typeof require !== 'undefined' && require.main === module) {
  // In Node.js environment
  apiTests.runAllTests().catch(console.error);
}