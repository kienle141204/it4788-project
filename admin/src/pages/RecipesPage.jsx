import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';

const RecipesPage = () => {
  const [recipes, setRecipes] = useState([
    { 
      id: 1, 
      dish: 'Thịt kho tàu', 
      ingredients: 'Thịt ba chỉ 500g, Trứng 4 quả, Nước dừa 200ml',
      steps: '1. Luộc thịt\n2. Rim với nước dừa\n3. Thêm trứng',
      tips: 'Nên dùng thịt ba chỉ có nhiều nạc'
    },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({ 
    dish: '', 
    ingredients: '', 
    steps: '', 
    tips: '' 
  });

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Món ăn', key: 'dish' },
    { 
      header: 'Nguyên liệu', 
      key: 'ingredients',
      render: (value) => <div className="max-w-xs truncate">{value}</div>
    },
    { 
      header: 'Các bước', 
      key: 'steps',
      render: (value) => <div className="max-w-xs truncate">{value}</div>
    },
  ];

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setFormData(recipe);
    setIsModalOpen(true);
  };

  const handleDelete = (recipe) => {
    if (window.confirm(`Bạn có chắc muốn xóa công thức "${recipe.dish}"?`)) {
      setRecipes(recipes.filter(r => r.id !== recipe.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRecipe) {
      setRecipes(recipes.map(r => r.id === editingRecipe.id ? { ...formData, id: editingRecipe.id } : r));
    } else {
      setRecipes([...recipes, { ...formData, id: recipes.length + 1 }]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
    setFormData({ dish: '', ingredients: '', steps: '', tips: '' });
  };

  const handleOpenModal = () => {
    setEditingRecipe(null);
    setFormData({ dish: '', ingredients: '', steps: '', tips: '' });
    setIsModalOpen(true);
  };

  const filteredRecipes = recipes.filter(r => 
    r.dish.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ingredients.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Công thức nấu ăn</h1>
        <Button icon={Plus} onClick={handleOpenModal}>
          Thêm công thức
        </Button>
      </div>

      <div className="mb-4">
        <SearchBar 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Tìm kiếm công thức..." 
        />
      </div>

      <Table 
        columns={columns} 
        data={filteredRecipes} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingRecipe ? 'Sửa công thức' : 'Thêm công thức mới'} 
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Input 
            label="Tên món ăn" 
            value={formData.dish} 
            onChange={(e) => setFormData({...formData, dish: e.target.value})} 
            required 
          />
          <TextArea 
            label="Nguyên liệu" 
            value={formData.ingredients} 
            onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
            placeholder="VD: Thịt ba chỉ 500g, Trứng 4 quả..."
            rows={3}
            required 
          />
          <TextArea 
            label="Các bước thực hiện" 
            value={formData.steps} 
            onChange={(e) => setFormData({...formData, steps: e.target.value})}
            placeholder="Nhập từng bước, mỗi bước một dòng..."
            rows={6}
            required 
          />
          <TextArea 
            label="Mẹo nấu ăn" 
            value={formData.tips} 
            onChange={(e) => setFormData({...formData, tips: e.target.value})}
            placeholder="Các mẹo hữu ích khi nấu món này..."
            rows={3}
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

export default RecipesPage;