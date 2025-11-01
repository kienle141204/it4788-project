import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';

const DishesPage = () => {
  const [dishes, setDishes] = useState([
    { id: 1, name: 'Thịt kho tàu', category: 'Món mặn', servings: '4', cookTime: '45', difficulty: 'Trung bình' },
    { id: 2, name: 'Canh chua cá', category: 'Canh', servings: '4', cookTime: '30', difficulty: 'Dễ' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    servings: '', 
    cookTime: '', 
    difficulty: '' 
  });

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Tên món ăn', key: 'name' },
    { header: 'Danh mục', key: 'category' },
    { header: 'Khẩu phần', key: 'servings', render: (value) => `${value} người` },
    { header: 'Thời gian nấu', key: 'cookTime', render: (value) => `${value} phút` },
    { 
      header: 'Độ khó', 
      key: 'difficulty',
      render: (value) => {
        const colors = {
          'Dễ': 'bg-green-100 text-green-800',
          'Trung bình': 'bg-yellow-100 text-yellow-800',
          'Khó': 'bg-red-100 text-red-800'
        };
        return <span className={`px-2 py-1 rounded-full text-xs ${colors[value]}`}>{value}</span>;
      }
    },
  ];

  const handleEdit = (dish) => {
    setEditingDish(dish);
    setFormData(dish);
    setIsModalOpen(true);
  };

  const handleDelete = (dish) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${dish.name}"?`)) {
      setDishes(dishes.filter(d => d.id !== dish.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDish) {
      setDishes(dishes.map(d => d.id === editingDish.id ? { ...formData, id: editingDish.id } : d));
    } else {
      setDishes([...dishes, { ...formData, id: dishes.length + 1 }]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDish(null);
    setFormData({ name: '', category: '', servings: '', cookTime: '', difficulty: '' });
  };

  const handleOpenModal = () => {
    setEditingDish(null);
    setFormData({ name: '', category: '', servings: '', cookTime: '', difficulty: '' });
    setIsModalOpen(true);
  };

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Tìm kiếm món ăn..." 
        />
      </div>

      <Table 
        columns={columns} 
        data={filteredDishes} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingDish ? 'Sửa món ăn' : 'Thêm món ăn mới'}
      >
        <form onSubmit={handleSubmit}>
          <Input 
            label="Tên món ăn" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Select 
            label="Danh mục" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={[
              { value: 'Món mặn', label: 'Món mặn' },
              { value: 'Canh', label: 'Canh' },
              { value: 'Món chay', label: 'Món chay' },
              { value: 'Món tráng miệng', label: 'Món tráng miệng' },
              { value: 'Món ăn sáng', label: 'Món ăn sáng' }
            ]}
            required 
          />
          <Input 
            label="Số khẩu phần" 
            type="number" 
            value={formData.servings} 
            onChange={(e) => setFormData({...formData, servings: e.target.value})} 
            required 
          />
          <Input 
            label="Thời gian nấu (phút)" 
            type="number" 
            value={formData.cookTime} 
            onChange={(e) => setFormData({...formData, cookTime: e.target.value})} 
            required 
          />
          <Select 
            label="Độ khó" 
            value={formData.difficulty} 
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            options={[
              { value: 'Dễ', label: 'Dễ' },
              { value: 'Trung bình', label: 'Trung bình' },
              { value: 'Khó', label: 'Khó' }
            ]}
            required 
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