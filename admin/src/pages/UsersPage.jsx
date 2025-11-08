import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import { fetchUsers, createUser, updateUser, deleteUser, searchUsers } from '../api/userAPI';
import { useAuth } from '../contexts/AuthContext';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    group: '',
    address: ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers();
      setUsers(response.data || response); // Handle both paginated and non-paginated responses
    } catch (error) {
      console.error('Error loading users:', error);
      // In a real app, you might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Họ tên', key: 'full_name' },
    { header: 'Email', key: 'email' },
    { header: 'Số điện thoại', key: 'phone' },
    { header: 'Nhóm', key: 'group' },
    { header: 'Địa chỉ', key: 'address' },
  ];

  const handleEdit = (user) => {
    setEditingUser(user);
    // Map the user data to match form field names
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      group: user.group,
      address: user.address
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa người dùng "${user.full_name}"?`)) {
      try {
        await deleteUser(user.id);
        // Remove user from local state after successful deletion
        setUsers(users.filter(u => u.id !== user.id));
      } catch (error) {
        console.error('Error deleting user:', error);
        // In a real app, you might want to show an error message to the user
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        const updatedUser = await updateUser(editingUser.id, formData);
        // Update user in local state
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      } else {
        // Create new user
        const newUser = await createUser(formData);
        // Add new user to local state
        setUsers([...users, newUser]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving user:', error);
      // In a real app, you might want to show an error message to the user
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ full_name: '', email: '', phone: '', group: '', address: '' });
  };

  const handleOpenModal = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', phone: '', group: '', address: '' });
    setIsModalOpen(true);
  };

  // Instead of client-side filtering, we'll implement server-side search
  // This approach uses API calls when search term changes, but falls back to client-side filtering if needed
  const performSearch = async (searchValue) => {
    if (searchValue.trim() === '') {
      // If search is empty, load all users
      loadUsers();
      return;
    }
    
    try {
      setLoading(true);
      const response = await searchUsers(searchValue);
      setUsers(response.data || response);
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to client-side filtering if API search fails
      const filtered = users.filter(u =>
        u.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        u.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      setUsers(filtered);
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

  const filteredUsers = users; // Now filtered by API

  // Show loading indicator while data is being fetched
  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          onChange={handleSearchChange}
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
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
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
          <Input
            label="Địa chỉ"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
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