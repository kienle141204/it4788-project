import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe, getRecipeById } from '../api/recipeAPI';
import { createDish } from '../api/dishAPI';

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
    dish_name: '',
    dish_description: '',
    image_url: '',
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

      // Handle paginated response - API returns {data: [...], details: {pagination: {...}}}
      let recipesData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      // Pagination có thể nằm ở response.pagination hoặc response.details.pagination
      const pagination = response?.pagination || response?.details?.pagination;

      if (response && response.data && pagination) {
        // Response is properly paginated
        recipesData = response.data;
        responseTotalPages = pagination.totalPages;
        responseTotalItems = pagination.totalItems;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response has data but no pagination
        recipesData = response.data;
        responseTotalPages = 1;
        responseTotalItems = response.data.length;
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

  const handleEdit = async (recipe) => {
    try {
      setDetailLoading(true);
      setIsEditModalOpen(true);

      // Fetch full recipe details including steps
      const fullRecipe = await getRecipeById(recipe.id);

      setEditingRecipe(fullRecipe);
      // Map the recipe data to match form field names
      setFormData({
        dish_id: fullRecipe.dish_id || fullRecipe.dish?.id || '',
        status: fullRecipe.status || '',
        steps: fullRecipe.steps || []
      });
    } catch (error) {
      console.error('Error loading recipe for edit:', error);
      // Fallback to basic data if fetch fails
      setEditingRecipe(recipe);
      setFormData({
        dish_id: recipe.dish_id || recipe.dish?.id || '',
        status: recipe.status || '',
        steps: recipe.steps || []
      });
    } finally {
      setDetailLoading(false);
    }
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
      dish_name: '',
      dish_description: '',
      image_url: '',
      status: '',
      steps: []
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipe) {
        // Update existing recipe
        // Backend UpdateRecipeDto accepts: status (public/private), steps (id, step_number, description)
        // Khi có id, backend sẽ giữ lại step và images của step đó
        const updateData = {
          status: formData.status || 'public',
          steps: formData.steps.map((step, index) => {
            const stepData = {
              step_number: parseInt(step.step_number) || (index + 1),
              description: step.description || ''
            };
            // Chỉ gửi id nếu có và là số hợp lệ
            if (step.id) {
              const stepId = parseInt(step.id);
              if (!isNaN(stepId)) {
                stepData.id = stepId;
              }
            }
            return stepData;
          })
        };

        const updatedRecipe = await updateRecipe(editingRecipe.id, updateData);
        // Reload recipes to get fresh data
        loadRecipes();
      } else {
        // Create new recipe - create dish first, then recipe
        // Validate required fields
        if (!formData.dish_name) {
          alert('Vui lòng nhập tên món ăn');
          return;
        }

        if (formData.steps.length === 0) {
          alert('Vui lòng thêm ít nhất 1 bước thực hiện');
          return;
        }

        // Create dish first
        const dishData = {
          name: formData.dish_name,
          description: formData.dish_description || '',
          image_url: formData.image_url || ''
        };

        const newDish = await createDish(dishData);
        const dishId = newDish.id || newDish.data?.id;

        // Then create recipe with the new dish_id
        const createData = {
          dish_id: dishId,
          status: formData.status || 'public',
          steps: formData.steps.map((step, index) => ({
            step_number: parseInt(step.step_number) || (index + 1),
            description: step.description || ''
          }))
        };

        const newRecipe = await createRecipe(createData);
        // Reload to get fresh data from server
        loadRecipes();
      }
      closeEditModal();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Có lỗi khi lưu công thức: ' + error.message);
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
        // Response is paginated {data: [...], details: {pagination: {...}}}
        recipesData = response.data;
        const pagination = response.pagination || response.details?.pagination;
        responseTotalPages = pagination?.totalPages || 1;
        responseTotalItems = pagination?.totalItems || recipesData.length;
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
          setFormData({ dish_name: '', dish_description: '', image_url: '', status: '', steps: [] });
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
        title={editingRecipe ? `Sửa công thức: ${editingRecipe.dish?.name || ''}` : 'Thêm công thức mới'}
        size="xl"
      >
        {detailLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Recipe Info Header */}
            {editingRecipe && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {editingRecipe.dish?.image_url && (
                    <img
                      src={editingRecipe.dish.image_url}
                      alt={editingRecipe.dish?.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{editingRecipe.dish?.name || 'N/A'}</h3>
                    <p className="text-sm text-gray-500">{editingRecipe.dish?.description || 'Không có mô tả'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Người sở hữu: {editingRecipe.owner?.full_name || editingRecipe.owner?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!editingRecipe && (
              <>
                <div className="mb-6">
                  <Input
                    label="Tên món ăn *"
                    value={formData.dish_name}
                    onChange={(e) => setFormData({ ...formData, dish_name: e.target.value })}
                    required
                    placeholder="Nhập tên món ăn"
                  />
                </div>
                <div className="mb-6">
                  <TextArea
                    label="Mô tả món ăn"
                    value={formData.dish_description}
                    onChange={(e) => setFormData({ ...formData, dish_description: e.target.value })}
                    placeholder="Nhập mô tả cho món ăn..."
                    rows={3}
                  />
                </div>
                <div className="mb-6">
                  <Input
                    label="URL Hình ảnh"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            {editingRecipe && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Input
                  label="ID"
                  type="number"
                  value={editingRecipe.id || ''}
                  disabled={true}
                />
                <Input
                  label="ID Món ăn"
                  type="number"
                  value={editingRecipe.dish_id || ''}
                  disabled={true}
                />
              </div>
            )}
            <div className="mb-6">
              <Select
                label="Trạng thái"
                value={formData.status || 'public'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'public', label: 'Công khai' },
                  { value: 'private', label: 'Riêng tư' }
                ]}
              />
            </div>

            {/* Steps Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Các bước thực hiện ({formData.steps.length} bước)
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newStep = {
                      step_number: formData.steps.length + 1,
                      description: ''
                    };
                    setFormData({ ...formData, steps: [...formData.steps, newStep] });
                  }}
                >
                  + Thêm bước
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {formData.steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Chưa có bước nào. Nhấn "Thêm bước" để bắt đầu.
                  </div>
                ) : (
                  formData.steps.map((step, index) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-medium text-sm">
                        {step.step_number || index + 1}
                      </div>
                      <div className="flex-1">
                        <TextArea
                          value={step.description || ''}
                          onChange={(e) => {
                            const newSteps = [...formData.steps];
                            newSteps[index] = {
                              ...newSteps[index],
                              description: e.target.value
                            };
                            setFormData({ ...formData, steps: newSteps });
                          }}
                          placeholder={`Mô tả bước ${index + 1}...`}
                          rows={2}
                          className="w-full"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => {
                          const newSteps = formData.steps.filter((_, i) => i !== index);
                          // Reorder step numbers
                          const reorderedSteps = newSteps.map((s, i) => ({
                            ...s,
                            step_number: i + 1
                          }));
                          setFormData({ ...formData, steps: reorderedSteps });
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="secondary" onClick={closeEditModal}>Hủy</Button>
              <Button type="submit">Lưu công thức</Button>
            </div>
          </form>
        )}
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