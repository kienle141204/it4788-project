import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchDishes, createDish, updateDish, deleteDish, searchDishes } from '../api/dishAPI';

const DishesPage = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Maximum 10 records per page
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: ''
  });

  // Load dishes on component mount
  useEffect(() => {
    loadDishes();
  }, []);

  // Load dishes from API
  const loadDishes = async () => {
    try {
      setLoading(true);
      const response = await fetchDishes();
      let dishesData = response.data || response; // Handle both paginated and non-paginated responses
      
      // Sort dishes by ID from smallest to largest
      dishesData = Array.isArray(dishesData) 
        ? [...dishesData].sort((a, b) => a.id - b.id)
        : dishesData;
        
      setDishes(dishesData);
    } catch (error) {
      console.error('Error loading dishes:', error);
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
        <img src={value} alt="Dish" className="w-12 h-12 object-cover rounded" />
      ) : (
        <span className="text-gray-400">Không có</span>
      )
    },
    { header: 'Tên món ăn', key: 'name' },
    { 
      header: 'Mô tả', 
      key: 'description', 
      render: (value) => <div className="max-w-xs truncate">{value || 'N/A'}</div>
    },
  ];

  const handleEdit = (dish) => {
    setEditingDish(dish);
    // Map the dish data to match form field names
    setFormData({
      name: dish.name,
      description: dish.description,
      image_url: dish.image_url
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (dish) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${dish.name}"?`)) {
      try {
        await deleteDish(dish.id);
        // Remove dish from local state after successful deletion
        setDishes(dishes.filter(d => d.id !== dish.id));
      } catch (error) {
        console.error('Error deleting dish:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with correct field names
      const dishData = {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url
      };

      if (editingDish) {
        // Update existing dish
        const updatedDish = await updateDish(editingDish.id, dishData);
        // Update dish in local state
        setDishes(dishes.map(d => d.id === editingDish.id ? updatedDish : d));
      } else {
        // Create new dish
        const newDish = await createDish(dishData);
        // Add new dish to local state
        setDishes([...dishes, newDish]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving dish:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDish(null);
    setFormData({ 
      name: '', 
      description: '', 
      image_url: '' 
    });
  };

  const handleOpenModal = () => {
    setEditingDish(null);
    setFormData({ 
      name: '', 
      description: '', 
      image_url: '' 
    });
    setIsModalOpen(true);
  };

  // Instead of client-side filtering, we'll implement server-side search
  // This approach uses API calls when search term changes, but falls back to client-side filtering if needed
  const performSearch = async (searchValue) => {
    if (searchValue.trim() === '') {
      // If search is empty, load all dishes
      loadDishes();
      return;
    }

    try {
      setLoading(true);
      const response = await searchDishes(searchValue);
      setDishes(response.data || response);
    } catch (error) {
      console.error('Error searching dishes:', error);
      // Fallback to client-side filtering if API search fails
      const filtered = dishes.filter(d =>
        d.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        d.category.toLowerCase().includes(searchValue.toLowerCase())
      );
      setDishes(filtered);
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

  const filteredDishes = dishes; // Now filtered by API

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDishes = filteredDishes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);

  // Show loading indicator while data is being fetched
  if (loading && dishes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Món ăn</h1>
        <Button icon={Plus} onClick={handleOpenModal}>
          Thêm món ăn
        </Button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm món ăn..."
        />
      </div>

      <Table
        columns={columns}
        data={currentDishes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDish ? 'Sửa món ăn' : 'Thêm món ăn mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Tên món ăn"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <TextArea
            label="Mô tả"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Nhập mô tả cho món ăn..."
            rows={4}
          />
          <Input
            label="URL Hình ảnh"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            placeholder="https://example.com/image.jpg"
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

export default DishesPage;