import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';

const UsersPage = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0901234567', group: 'Admin', status: 'Hoạt động' },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@gmail.com', phone: '0912345678', group: 'Người dùng', status: 'Hoạt động' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    group: '', 
    status: 'Hoạt động' 
  });

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Họ tên', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Số điện thoại', key: 'phone' },
    { header: 'Nhóm', key: 'group' },
    { 
      header: 'Trạng thái', 
      key: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
  ];

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...formData, id: editingUser.id } : u));
    } else {
      setUsers([...users, { ...formData, id: users.length + 1 }]);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', group: '', status: 'Hoạt động' });
  };

  const handleOpenModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', group: '', status: 'Hoạt động' });
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h1>
        <Button icon={Plus} onClick={handleOpenModal}>
          Thêm người dùng
        </Button>
      </div>

      <div className="mb-4">
        <SearchBar 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="Tìm kiếm người dùng..." 
        />
      </div>

      <Table 
        columns={columns} 
        data={filteredUsers} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
      >
        <form onSubmit={handleSubmit}>
          <Input 
            label="Họ tên" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Input 
            label="Email" 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <Input 
            label="Số điện thoại" 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
            required 
          />
          <Select 
            label="Nhóm người dùng" 
            value={formData.group} 
            onChange={(e) => setFormData({...formData, group: e.target.value})}
            options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Người dùng', label: 'Người dùng' },
              { value: 'Người dùng VIP', label: 'Người dùng VIP' }
            ]}
            required 
          />
          <Select 
            label="Trạng thái" 
            value={formData.status} 
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            options={[
              { value: 'Hoạt động', label: 'Hoạt động' },
              { value: 'Tạm khóa', label: 'Tạm khóa' }
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

export default UsersPage;