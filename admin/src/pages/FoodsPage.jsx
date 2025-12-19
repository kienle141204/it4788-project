import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchIngredients, createIngredient, updateIngredient, deleteIngredient, searchIngredients } from '../api/ingredientAPI';

const FoodsPage = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Maximum 10 records per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    image_url: '',
    category_id: '',
    place_id: ''
  });

  // Load ingredients on component mount
  useEffect(() => {
    loadIngredients();
  }, [currentPage]); // Add currentPage to dependency array for pagination

  // Load ingredients from API
  const loadIngredients = async () => {
    try {
      setLoading(true);
      // Pass pagination params to API
      const response = await fetchIngredients({
        page: currentPage,
        limit: itemsPerPage
      });

      // Handle paginated response - API returns {data: [...], pagination: {...}}
      let ingredientsData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && Array.isArray(response)) {
        // Response is directly an array (non-paginated)
        ingredientsData = response;
        responseTotalPages = 1;
        responseTotalItems = response.length;
      } else if (response && response.data) {
        // Response is paginated {data: [...], pagination: {...}}
        ingredientsData = response.data;
        responseTotalPages = response.pagination?.totalPages || 1;
        responseTotalItems = response.pagination?.totalItems || ingredientsData.length;
      }

      // Sort ingredients by ID from smallest to largest
      ingredientsData = [...ingredientsData].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });

      setFoods(ingredientsData);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', key: 'id' },
    {
      header: 'Hình ảnh',
      key: 'image_url',
      render: (value) => value ? (
        <img src={value} alt="Ingredient" className="w-10 h-10 object-cover rounded" />
      ) : (
        <span className="text-gray-400">Không có</span>
      )
    },
    { header: 'Tên thực phẩm', key: 'name' },
    {
      header: 'Danh mục',
      key: 'category_id',
      render: (value, row) => {
        // Map category IDs to names
        const categoryNames = {
          '1': 'Thịt',
          '2': 'Rau củ',
          '3': 'Trái cây',
          '4': 'Hải sản',
          '5': 'Cá',
          '6': 'Gia vị'
        };
        return categoryNames[value] || row.category?.name || value;
      }
    },
    {
      header: 'Giá',
      key: 'price',
      render: (value) => `${parseInt(value || 0).toLocaleString('vi-VN')}đ`
    },
  ];

  const handleEdit = (food) => {
    setEditingFood(food);
    // Map the ingredient data to match form field names
    setFormData({
      name: food.name,
      price: food.price,
      image_url: food.image_url,
      category_id: food.category_id || food.category?.id || '',
      place_id: food.place_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (food) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${food.name}"?`)) {
      try {
        await deleteIngredient(food.id);
        // Remove ingredient from local state after successful deletion
        setFoods(foods.filter(f => f.id !== food.id));
      } catch (error) {
        console.error('Error deleting ingredient:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with correct field names
      const ingredientData = {
        name: formData.name,
        price: parseFloat(formData.price),
        image_url: formData.image_url,
        category_id: parseInt(formData.category_id),
        place_id: parseInt(formData.place_id) || 1 // Default to 1 if not provided
      };

      if (editingFood) {
        // Update existing ingredient
        const updatedIngredient = await updateIngredient(editingFood.id, ingredientData);
        // Update ingredient in local state
        setFoods(foods.map(f => f.id === editingFood.id ? updatedIngredient : f));
      } else {
        // Create new ingredient
        const newIngredient = await createIngredient(ingredientData);
        // Add new ingredient to local state
        setFoods([...foods, newIngredient]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFood(null);
    setFormData({
      name: '',
      price: '',
      image_url: '',
      category_id: '',
      place_id: ''
    });
  };

  const handleOpenModal = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      price: '',
      image_url: '',
      category_id: '',
      place_id: ''
    });
    setIsModalOpen(true);
  };

  // Instead of client-side filtering, we'll implement server-side search
  // This approach uses API calls when search term changes
  const performSearch = async (searchValue) => {
    if (searchValue.trim() === '') {
      // If search is empty, load all ingredients
      loadIngredients();
      return;
    }

    try {
      setLoading(true);
      const response = await searchIngredients(searchValue, 1, itemsPerPage);

      let ingredientsData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && Array.isArray(response)) {
        // Response is directly an array (non-paginated)
        ingredientsData = response;
        responseTotalPages = 1;
        responseTotalItems = response.length;
      } else if (response && response.data) {
        // Response is paginated {data: [...], pagination: {...}}
        ingredientsData = response.data;
        responseTotalPages = response.pagination?.totalPages || 1;
        responseTotalItems = response.pagination?.totalItems || ingredientsData.length;
      }

      setFoods(ingredientsData);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
      setCurrentPage(1); // Reset to first page after search
    } catch (error) {
      console.error('Error searching ingredients:', error);
      // Fallback to client-side filtering if API search fails
      const filtered = foods.filter(f =>
        f.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        f.category?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFoods(filtered);
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

  // Use foods directly as they come from the API response with proper pagination
  const currentFoods = foods;

  // Show loading indicator while data is being fetched
  if (loading && foods.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Thực phẩm</h1>
        <Button icon={Plus} onClick={handleOpenModal}>
          Thêm thực phẩm
        </Button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm thực phẩm..."
        />
      </div>

      <Table
        columns={columns}
        data={currentFoods}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingFood ? 'Sửa thực phẩm' : 'Thêm thực phẩm mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Tên thực phẩm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Danh mục"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={[
              { value: '1', label: 'Thịt' },
              { value: '2', label: 'Rau củ' },
              { value: '3', label: 'Trái cây' },
              { value: '4', label: 'Hải sản' },
              { value: '5', label: 'Cá' },
              { value: '6', label: 'Gia vị' }
            ]}
            required
          />
          <Input
            label="Giá (VNĐ)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
          <Input
            label="URL Hình ảnh"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          <Input
            label="ID Địa điểm (place_id)"
            type="number"
            value={formData.place_id}
            onChange={(e) => setFormData({ ...formData, place_id: e.target.value })}
          />
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FoodsPage;