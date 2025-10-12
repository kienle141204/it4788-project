import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';

const FoodsPage = () => {
  const [foods, setFoods] = useState([
    { id: 1, name: 'Thịt ba chỉ', category: 'Thịt', unit: 'kg', price: '150000', status: 'Còn hàng' },
    { id: 2, name: 'Cải thảo', category: 'Rau', unit: 'kg', price: '15000', status: 'Còn hàng' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    category: '', 
    unit: '', 
    price: '', 
    status: 'Còn hàng' 
  });

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Tên thực phẩm', key: 'name' },
    { header: 'Danh mục', key: 'category' },
    { header: 'Đơn vị', key: 'unit' },
    { 
      header: 'Giá', 
      key: 'price',
      render: (value) => `${parseInt(value).toLocaleString('vi-VN')}đ`
    },
    { 
      header: 'Trạng thái', 
      key: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Còn hàng' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
  ];

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData(food);
    setIsModalOpen(true);
  };

  const handleDelete = (food) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${food.name}"?`)) {
      setFoods(foods.filter(f => f.id !== food.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFood) {
      setFoods(foods.map(f => f.id === editingFood.id ? { ...formData, id: editingFood.id } : f));
    } else {
      setFoods([...foods, { ...formData, id: foods.length + 1 }]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFood(null);
    setFormData({ name: '', category: '', unit: '', price: '', status: 'Còn hàng' });
  };

  const handleOpenModal = () => {
    setEditingFood(null);
    setFormData({ name: '', category: '', unit: '', price: '', status: 'Còn hàng' });
    setIsModalOpen(true);
  };

  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Tìm kiếm thực phẩm..." 
        />
      </div>

      <Table 
        columns={columns} 
        data={filteredFoods} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingFood ? 'Sửa thực phẩm' : 'Thêm thực phẩm mới'}
      >
        <form onSubmit={handleSubmit}>
          <Input 
            label="Tên thực phẩm" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Select 
            label="Danh mục" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={[
              { value: 'Thịt', label: 'Thịt' },
              { value: 'Rau', label: 'Rau' },
              { value: 'Trái cây', label: 'Trái cây' },
              { value: 'Hải sản', label: 'Hải sản' },
              { value: 'Gia vị', label: 'Gia vị' }
            ]}
            required 
          />
          <Select 
            label="Đơn vị tính" 
            value={formData.unit} 
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
            options={[
              { value: 'kg', label: 'Kilogram (kg)' },
              { value: 'g', label: 'Gram (g)' },
              { value: 'cái', label: 'Cái' },
              { value: 'túi', label: 'Túi' },
              { value: 'lít', label: 'Lít' }
            ]}
            required 
          />
          <Input 
            label="Giá (VNĐ)" 
            type="number" 
            value={formData.price} 
            onChange={(e) => setFormData({...formData, price: e.target.value})} 
            required 
          />
          <Select 
            label="Trạng thái" 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            options={[
              { value: 'Còn hàng', label: 'Còn hàng' },
              { value: 'Hết hàng', label: 'Hết hàng' }
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

export default FoodsPage;