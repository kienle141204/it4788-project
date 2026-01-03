import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchUsers, createUser, updateUser, deleteUser, searchUsers } from '../api/userAPI';
import { useAuth } from '../contexts/AuthContext';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Maximum 10 records per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Utility function to normalize user object field names for consistent display
  const normalizeUserObject = (user) => {
    return {
      ...user,
      // Ensure 'role' field is used instead of 'group' for consistency
      role: user.role || user.group || ''
    };
  };

  const [formData, setFormData] = useState({
    'full_name': '',
    'email': '',
    'phone': '',
    'role': '',
    'address': ''
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [currentPage]); // Add currentPage to dependency array for pagination

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers({
        page: currentPage,
        limit: itemsPerPage
      });

      // Handle paginated response - API returns {data: [...], pagination: {...}}
      let usersData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && Array.isArray(response)) {
        // Response is directly an array (non-paginated)
        usersData = response;
        responseTotalPages = 1;
        responseTotalItems = response.length;
      } else if (response && response.data) {
        // Response is paginated {data: [...], pagination: {...}}
        usersData = response.data;
        responseTotalPages = response.pagination?.totalPages || 1;
        responseTotalItems = response.pagination?.totalItems || usersData.length;
      }

      // Sort users by ID from smallest to largest
      usersData = [...usersData].sort((a, b) => {
        const aId = parseInt(a.id) || 0;
        const bId = parseInt(b.id) || 0;
        return aId - bId;
      });

      // Normalize all users to ensure consistent field names
      const normalizedUsers = usersData.map(normalizeUserObject);

      setUsers(normalizedUsers);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      // In a real app, you might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'ID', key: 'id' },
    {
      header: 'Ảnh',
      key: 'avatar_url',
      render: (value, row) => value ? (
        <img src={value} alt={row.full_name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-medium">
          {row.full_name?.charAt(0)?.toUpperCase() || row.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )
    },
    { header: 'Họ tên', key: 'full_name' },
    { header: 'Email', key: 'email' },
    { header: 'Số điện thoại', key: 'phone' },
    {
      header: 'Nhóm',
      key: 'role',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${value === 'admin'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-700'
          }`}>
          {value === 'admin' ? 'Admin' : value === 'user' ? 'Người dùng' : value || '-'}
        </span>
      )
    },
  ];

  const handleEdit = (user) => {
    // Normalize user object to ensure consistent field names
    const normalizedUser = normalizeUserObject(user);
    setEditingUser(normalizedUser);
    // Map the user data to match form field names, converting null to empty string
    setFormData({
      full_name: normalizedUser.full_name || '',
      email: normalizedUser.email || '',
      phone: normalizedUser.phone || '',
      role: normalizedUser.role || '',
      address: normalizedUser.address || ''
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
        await updateUser(editingUser.id, formData);
        // Reload user data to ensure consistency with backend
        await loadUsers();
      } else {
        // Create new user
        await createUser(formData);
        // Reload user data to ensure consistency with backend
        await loadUsers();
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
    setFormData({ full_name: '', email: '', phone: '', role: '', address: '' });
  };

  const handleOpenModal = () => {
    setEditingUser(null);
    setFormData({ full_name: '', email: '', phone: '', role: '', address: '' });
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
      const response = await searchUsers(searchValue, 1, itemsPerPage);

      let usersData = [];
      let responseTotalPages = 1;
      let responseTotalItems = 0;

      if (response && Array.isArray(response)) {
        // Response is directly an array (non-paginated)
        usersData = response;
        responseTotalPages = 1;
        responseTotalItems = response.length;
      } else if (response && response.data) {
        // Response is paginated {data: [...], pagination: {...}}
        usersData = response.data;
        responseTotalPages = response.pagination?.totalPages || 1;
        responseTotalItems = response.pagination?.totalItems || usersData.length;
      }

      // Normalize all users to ensure consistent field names
      const normalizedUsers = usersData.map(normalizeUserObject);

      setUsers(normalizedUsers);
      setTotalPages(responseTotalPages || 1);
      setTotalItems(responseTotalItems || 0);
      setCurrentPage(1); // Reset to first page after search
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to client-side filtering if API search fails
      const filtered = users.filter(u =>
        u.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        u.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      // Normalize all users to ensure consistent field names
      const normalizedUsers = filtered.map(normalizeUserObject);
      setUsers(normalizedUsers);
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

  // Use users directly as they come from the API response with proper pagination
  const currentUsers = users;

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
        data={currentUsers}
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
        title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Họ tên"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Select
            label="Nhóm người dùng"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'user', label: 'Người dùng' }
            ]}
            required
          />
          <Input
            label="Địa chỉ"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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