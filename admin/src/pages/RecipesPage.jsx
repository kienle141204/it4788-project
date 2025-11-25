import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe, getRecipeById } from '../api/recipeAPI';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Maximum 10 records per page
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({
    dish_id: '',
    status: '',
    steps: []
  });
  const [detailLoading, setDetailLoading] = useState(false);

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes();
  }, [currentPage]); // Add currentPage to dependency array for pagination

  // State for pagination
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && response.data && response.pagination) {
        // Response is properly paginated
        recipesData = response.data;
        responseTotalPages = response.pagination.totalPages;
        responseTotalItems = response.pagination.totalItems;
      } else if (Array.isArray(response)) {
        // Fallback if response is directly an array
        recipesData = response;
        responseTotalPages = 1; // Or calculate based on itemsPerPage
        responseTotalItems = response.length;
      }

      // Sort recipes by ID from smallest to largest
      recipesData = [...recipesData].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });

      setRecipes(recipesData);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => viewRecipeDetails(row.id)}
            icon={Eye}
          >
            Xem
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleEdit(row)}
            icon={Edit}
          >
            Sửa
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(row)}
            icon={Trash2}
          >
            Xóa
          </Button>
        </div>
      )
    },
  ];

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    // Map the recipe data to match form field names
    setFormData({
      dish_id: recipe.dish_id || recipe.dish?.id || '',
      status: recipe.status || '',
      steps: recipe.steps || []
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (recipe) => {
    if (window.confirm(`Bạn có chắc muốn xóa công thức "${recipe.dish?.name || 'N/A'}"?`)) {
      try {
        await deleteRecipe(recipe.id);
        // Remove recipe from local state after successful deletion
        setRecipes(recipes.filter(r => r.id !== recipe.id));
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecipe(null);
    setFormData({
      dish_id: '',
      status: '',
      steps: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with correct field names
      const recipeData = {
        dish_id: parseInt(formData.dish_id),
        status: formData.status,
        steps: formData.steps
      };

      if (editingRecipe) {
        // Update existing recipe
        const updatedRecipe = await updateRecipe(editingRecipe.id, recipeData);
        // Update recipe in local state
        setRecipes(recipes.map(r => r.id === editingRecipe.id ? updatedRecipe : r));
      } else {
        // Create new recipe
        const newRecipe = await createRecipe(recipeData);
        // Add new recipe to local state
        setRecipes([...recipes, newRecipe]);
      }
      closeEditModal();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
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
      
      let recipesData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && Array.isArray(response)) {
        // Response is directly an array (non-paginated)
        recipesData = response;
        responseTotalPages = 1;
        responseTotalItems = response.length;
      } else if (response && response.data) {
        // Response is paginated {data: [...], pagination: {...}}
        recipesData = response.data;
        responseTotalPages = response.pagination?.totalPages || 1;
        responseTotalItems = response.pagination?.totalItems || recipesData.length;
      }

      // Sort recipes by ID from smallest to largest
      recipesData = [...recipesData].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });

      setRecipes(recipesData);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
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

  // Use recipes directly as they come from the API response with proper pagination
  const currentRecipes = Array.isArray(recipes) ? recipes : [];

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
      </div>

      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm công thức..."
        />
      </div>

      <div className="mb-6">
        <Button icon={Plus} onClick={() => {
          setEditingRecipe(null);
          setFormData({ dish_id: '', status: '', steps: [] });
          setIsEditModalOpen(true);
        }}>
          Thêm công thức
        </Button>
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

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={editingRecipe ? 'Sửa công thức' : 'Thêm công thức mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="ID Món ăn"
            type="number"
            value={formData.dish_id}
            onChange={(e) => setFormData({...formData, dish_id: e.target.value})}
            required
          />
          <Input
            label="Trạng thái"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            placeholder="public, private, etc."
          />
          <TextArea
            label="Các bước thực hiện (JSON)"
            value={JSON.stringify(formData.steps, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setFormData({...formData, steps: Array.isArray(parsed) ? parsed : []});
              } catch (error) {
                // If JSON is invalid, keep the current steps
                console.error('Invalid JSON:', error);
              }
            }}
            placeholder=' [{"step_number": 1, "description": "Chuẩn bị nguyên liệu"}]'
            rows={6}
          />
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="secondary" onClick={closeEditModal}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>

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

            {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg">Các bước thực hiện:</h3>
                <ul className="list-decimal list-inside space-y-2">
                  {selectedRecipe.steps.map((step, index) => (
                    <li key={index}>
                      <span className="font-medium">Bước {step.step_number || index + 1}:</span> {step.description}
                    </li>
                  ))}
                </ul>
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