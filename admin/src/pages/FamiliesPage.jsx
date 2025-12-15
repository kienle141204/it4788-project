import React, { useState, useEffect } from 'react';
import { Plus, Users, Eye } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import { fetchFamilies, createFamily, updateFamily, deleteFamily, getFamilyMembers, searchFamilies } from '../api/familyAPI';

const FamiliesPage = () => {
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [editingFamily, setEditingFamily] = useState(null);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        loadFamilies();
    }, [currentPage]);

    const loadFamilies = async () => {
        try {
            setLoading(true);
            const response = await fetchFamilies({
                page: currentPage,
                limit: itemsPerPage
            });

            let familiesData = [];
            let responseTotalPages = 1;
            let responseTotalItems = 0;

            if (response && Array.isArray(response)) {
                familiesData = response;
                responseTotalPages = 1;
                responseTotalItems = response.length;
            } else if (response && response.data) {
                familiesData = response.data;
                responseTotalPages = response.pagination?.totalPages || 1;
                responseTotalItems = response.pagination?.totalItems || familiesData.length;
            } else if (response && Array.isArray(response)) {
                familiesData = response;
            }

            familiesData = [...familiesData].sort((a, b) => {
                const aId = parseInt(a.id) || 0;
                const bId = parseInt(b.id) || 0;
                return aId - bId;
            });

            setFamilies(familiesData);
            setTotalPages(responseTotalPages || 1);
            setTotalItems(responseTotalItems || 0);
        } catch (error) {
            console.error('Error loading families:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', key: 'id' },
        { header: 'Tên gia đình', key: 'name' },
        {
            header: 'Nhóm trưởng',
            key: 'owner',
            render: (value, row) => row.owner?.full_name || row.owner?.email || `User #${row.owner_id}`
        },
        { header: 'Mã mời', key: 'invitation_code' },
        { header: 'Ngày tạo', key: 'created_at', render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '' },
    ];

    const handleEdit = (family) => {
        setEditingFamily(family);
        setFormData({
            name: family.name || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (family) => {
        if (window.confirm(`Bạn có chắc muốn xóa gia đình "${family.name}"?`)) {
            try {
                await deleteFamily(family.id);
                setFamilies(families.filter(f => f.id !== family.id));
            } catch (error) {
                console.error('Error deleting family:', error);
            }
        }
    };

    const handleViewMembers = async (family) => {
        setSelectedFamily(family);
        setIsMembersModalOpen(true);
        setMembersLoading(true);
        try {
            const response = await getFamilyMembers(family.id);
            setFamilyMembers(response.data || response || []);
        } catch (error) {
            console.error('Error loading family members:', error);
            setFamilyMembers([]);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFamily) {
                await updateFamily(editingFamily.id, formData);
                await loadFamilies();
            } else {
                await createFamily(formData);
                await loadFamilies();
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving family:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFamily(null);
        setFormData({ name: '' });
    };

    const handleOpenModal = () => {
        setEditingFamily(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const performSearch = async (searchValue) => {
        if (searchValue.trim() === '') {
            loadFamilies();
            return;
        }

        try {
            setLoading(true);
            const response = await searchFamilies(searchValue, 1, itemsPerPage);

            let familiesData = [];
            let responseTotalPages = 1;
            let responseTotalItems = 0;

            if (response && Array.isArray(response)) {
                familiesData = response;
                responseTotalPages = 1;
                responseTotalItems = response.length;
            } else if (response && response.data) {
                familiesData = response.data;
                responseTotalPages = response.pagination?.totalPages || 1;
                responseTotalItems = response.pagination?.totalItems || familiesData.length;
            }

            setFamilies(familiesData);
            setTotalPages(responseTotalPages || 1);
            setTotalItems(responseTotalItems || 0);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error searching families:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    const customActions = (item) => (
        <button
            onClick={() => handleViewMembers(item)}
            className="text-blue-600 hover:text-blue-800 mr-2"
            title="Xem thành viên"
        >
            <Users size={18} />
        </button>
    );

    if (loading && families.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Gia đình</h1>
                <Button icon={Plus} onClick={handleOpenModal}>
                    Thêm gia đình
                </Button>
            </div>

            <div className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm gia đình..."
                />
            </div>

            <Table
                columns={columns}
                data={families}
                onEdit={handleEdit}
                onDelete={handleDelete}
                customActions={customActions}
            />

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingFamily ? 'Sửa gia đình' : 'Thêm gia đình mới'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Tên gia đình"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="flex gap-2 justify-end mt-6">
                        <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
                        <Button type="submit">Lưu</Button>
                    </div>
                </form>
            </Modal>

            {/* Members Modal */}
            <Modal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                title={`Thành viên - ${selectedFamily?.name || ''}`}
            >
                {membersLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div>
                        {familyMembers.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Chưa có thành viên nào</p>
                        ) : (
                            <div className="space-y-3">
                                {familyMembers.map((member, index) => {
                                    const isLeader = member.role === 'owner' || member.role === 'manager' || member.user_id === selectedFamily?.owner_id;
                                    return (
                                        <div key={member.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {(member.user?.avatar_url || member.avatar_url) ? (
                                                    <img
                                                        src={member.user?.avatar_url || member.avatar_url}
                                                        alt={member.user?.full_name || member.full_name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {member.user?.full_name?.charAt(0) || member.full_name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium">{member.user?.full_name || member.full_name || 'Không rõ'}</p>
                                                    <p className="text-sm text-gray-500">{member.user?.email || member.email || ''}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${isLeader ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {isLeader ? 'Nhóm trưởng' : 'Thành viên'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FamiliesPage;
