import React, { useState, useEffect } from 'react';
import { Plus, Eye } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchRecipes, getRecipeById } from '../api/recipeAPI';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Maximum 10 records per page
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes();
  }, [currentPage]); // Add currentPage to dependency array for pagination

  // Load recipes from API
  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetchRecipes({ 
        page: currentPage, 
        limit: itemsPerPage 
      });
      
      // Handle paginated response - API returns {data: [...], pagination: {...}}
      let recipesData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          recipesData = response.data;
        } else {
          recipesData = [];
        }
      } else if (Array.isArray(response)) {
        // Fallback if response is directly an array
        recipesData = response;
      }
      
      // Sort recipes by ID from smallest to largest  
      recipesData = [...recipesData].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });
        
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', key: 'id' },
    { 
      header: 'Hình ảnh', 
      key: 'dish.image_url',
      render: (value, row) => row.dish?.image_url ? (
        <img src={row.dish.image_url} alt="Recipe" className="w-12 h-12 object-cover rounded" />
      ) : (
        <span className="text-gray-400">Không có</span>
      )
    },
    { 
      header: 'Tên công thức', 
      key: 'dish.name',
      render: (value, row) => row.dish?.name || 'N/A'
    },
    { 
      header: 'Người sở hữu', 
      key: 'owner.full_name',
      render: (value, row) => row.owner?.full_name || row.owner?.email || 'N/A'
    },
    {
      header: 'Hành động',
      key: 'actions',
      render: (value, row) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => viewRecipeDetails(row.id)}
          icon={Eye}
        >
          Xem chi tiết
        </Button>
      )
    },
  ];

  // View recipe details
  const viewRecipeDetails = async (recipeId) => {
    try {
      setDetailLoading(true);
      const recipe = await getRecipeById(recipeId);
      setSelectedRecipe(recipe);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error loading recipe details:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Close detail modal
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecipe(null);
  };

  // Instead of client-side filtering, we'll implement server-side search
  const performSearch = async (searchValue) => {
    if (searchValue.trim() === '') {
      // If search is empty, load all recipes
      loadRecipes();
      return;
    }

    try {
      setLoading(true);
      // For recipe search, we'll use the recipes API with query parameters
      const response = await fetchRecipes({ 
        page: 1, // Reset to page 1 for search
        limit: itemsPerPage,
        q: searchValue
      });
      
      let recipesData;
      if (response.data && Array.isArray(response.data)) {
        // If response has data array, use it
        recipesData = response.data;
      } else if (Array.isArray(response)) {
        // If response is directly an array, use it
        recipesData = response;
      } else {
        // Fallback
        recipesData = [];
      }
      
      // Sort recipes by ID from smallest to largest
      recipesData = Array.isArray(recipesData) 
        ? [...recipesData].sort((a, b) => parseInt(a.id) - parseInt(b.id))
        : recipesData;
        
      setRecipes(recipesData);
      setCurrentPage(1); // Reset to first page after search
    } catch (error) {
      console.error('Error searching recipes:', error);
      // Fallback to client-side filtering if API search fails
      const filtered = recipes.filter(r =>
        (r.dish?.name?.toLowerCase().includes(searchValue.toLowerCase()) || false) ||
        (r.owner?.full_name?.toLowerCase().includes(searchValue.toLowerCase()) || false) ||
        (r.owner?.email?.toLowerCase().includes(searchValue.toLowerCase()) || false)
      );
      setRecipes(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce search to avoid too many API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Use recipes directly since they come paginated from API
  const currentRecipes = recipes;
  // Placeholder for total pages - would need to get this from API response if available
  // For now, we'll use a simple calculation based on total items if available in API response
  // If the API response includes pagination info, we should use it
  const totalPages = 10; // This should ideally come from the API response

  // Show loading indicator while data is being fetched
  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Công thức nấu ăn</h1>
        {/* Remove the "Add Recipe" button for now since we're focusing on viewing */}
      </div>

      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm công thức..."
        />
      </div>

      <Table
        columns={columns}
        data={currentRecipes}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title={selectedRecipe?.dish?.name || "Chi tiết công thức"}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : selectedRecipe ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Món ăn:</h3>
              <p>{selectedRecipe.dish?.name || 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">Mô tả:</h3>
              <p>{selectedRecipe.dish?.description || 'Không có mô tả'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Người sở hữu:</h3>
              <p>{selectedRecipe.owner?.full_name || selectedRecipe.owner?.email || 'N/A'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Trạng thái:</h3>
              <p>{selectedRecipe.status || 'Chưa xác định'}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Ngày tạo:</h3>
              <p>{selectedRecipe.created_at ? new Date(selectedRecipe.created_at).toLocaleString('vi-VN') : 'N/A'}</p>
            </div>

            {selectedRecipe && (
              <div>
                <h3 className="font-semibold text-lg">Các bước thực hiện:</h3>
                <p>Chi tiết các bước sẽ được hiển thị ở đây khi xem công thức chi tiết.</p>
                {/* Steps would be available in detailed view from the API */}
              </div>
            )}
          </div>
        ) : (
          <p>Không có thông tin công thức</p>
        )}
        
        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={closeDetailModal}>Đóng</Button>
        </div>
      </Modal>
    </div>
  );
};

export default RecipesPage;