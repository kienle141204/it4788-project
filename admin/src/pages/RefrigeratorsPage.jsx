import React, { useState, useEffect } from 'react';
import { Plus, Eye, Package, Utensils } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import {
    fetchRefrigerators,
    getRefrigeratorById,
    deleteRefrigerator,
    getRefrigeratorDishes,
    getRefrigeratorIngredients
} from '../api/refrigeratorAPI';

const RefrigeratorsPage = () => {
    const [refrigerators, setRefrigerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedFridge, setSelectedFridge] = useState(null);
    const [fridgeContents, setFridgeContents] = useState({ dishes: [], ingredients: [] });
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ingredients');

    useEffect(() => {
        loadRefrigerators();
    }, [currentPage]);

    const loadRefrigerators = async () => {
        try {
            setLoading(true);
            const response = await fetchRefrigerators({
                page: currentPage,
                limit: itemsPerPage
            });

            let fridgesData = [];
            let responseTotalPages = 1;
            let responseTotalItems = 0;

            if (response && response.data) {
                fridgesData = response.data;
                responseTotalPages = response.pagination?.totalPages || 1;
                responseTotalItems = response.pagination?.totalItems || fridgesData.length;
            } else if (response && Array.isArray(response)) {
                fridgesData = response;
                responseTotalPages = 1;
                responseTotalItems = response.length;
            }

            fridgesData = [...fridgesData].sort((a, b) => {
                const aId = parseInt(a.id) || 0;
                const bId = parseInt(b.id) || 0;
                return aId - bId;
            });

            setRefrigerators(fridgesData);
            setTotalPages(responseTotalPages || 1);
            setTotalItems(responseTotalItems || 0);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'ID', key: 'id' },
        {
            header: 'Tên tủ lạnh',
            key: 'family',
            render: (value, row) => row.family?.name || row.name || `Tủ lạnh #${row.id}`
        },
        {
            header: 'Chủ sở hữu',
            key: 'owner_id',
            render: (value, row) => row.owner?.full_name || row.owner?.email || `User #${value}`
        },
        {
            header: 'Ngày tạo',
            key: 'created_at',
            render: (value) => value ? new Date(value).toLocaleDateString('vi-VN') : ''
        },
    ];

    const handleViewDetail = async (fridge) => {
        setSelectedFridge(fridge);
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        setActiveTab('ingredients');

        try {
            const [dishesRes, ingredientsRes] = await Promise.all([
                getRefrigeratorDishes(fridge.id, { page: 1, limit: 50 }).catch(() => ({ data: [] })),
                getRefrigeratorIngredients(fridge.id, { page: 1, limit: 50 }).catch(() => ({ data: [] }))
            ]);

            setFridgeContents({
                dishes: dishesRes.data || dishesRes || [],
                ingredients: ingredientsRes.data || ingredientsRes || []
            });
        } catch (error) {
            setFridgeContents({ dishes: [], ingredients: [] });
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDelete = async (fridge) => {
        if (window.confirm(`Bạn có chắc muốn xóa tủ lạnh "${fridge.name}"?`)) {
            try {
                await deleteRefrigerator(fridge.id);
                setRefrigerators(refrigerators.filter(f => f.id !== fridge.id));
            } catch (error) {
            }
        }
    };

    const performSearch = async (searchValue) => {
        if (searchValue.trim() === '') {
            loadRefrigerators();
            return;
        }

        // Client-side filtering
        const filtered = refrigerators.filter(fridge =>
            fridge.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
            fridge.id.toString().includes(searchValue) ||
            fridge.owner_id?.toString().includes(searchValue)
        );
        setRefrigerators(filtered);
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
            onClick={() => handleViewDetail(item)}
            className="text-blue-600 hover:text-blue-800 mr-2"
            title="Xem nội dung"
        >
            <Eye size={18} />
        </button>
    );

    const formatExpiryDate = (date) => {
        if (!date) return '';
        const expiry = new Date(date);
        const now = new Date();
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return <span className="text-red-600 font-medium">Đã hết hạn</span>;
        } else if (diffDays <= 3) {
            return <span className="text-orange-600 font-medium">Còn {diffDays} ngày</span>;
        } else {
            return <span className="text-green-600">{expiry.toLocaleDateString('vi-VN')}</span>;
        }
    };

    if (loading && refrigerators.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Tủ lạnh</h1>
            </div>

            <div className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm tủ lạnh..."
                />
            </div>

            <Table
                columns={columns}
                data={refrigerators}
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

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Nội dung tủ lạnh: ${selectedFridge?.name || ''}`}
            >
                {detailLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div>
                        {/* Tabs */}
                        <div className="flex border-b mb-4">
                            <button
                                onClick={() => setActiveTab('ingredients')}
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'ingredients'
                                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Package size={18} />
                                Nguyên liệu ({fridgeContents.ingredients.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('dishes')}
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === 'dishes'
                                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Utensils size={18} />
                                Món ăn ({fridgeContents.dishes.length})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {activeTab === 'ingredients' && (
                                <div className="space-y-2">
                                    {fridgeContents.ingredients.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">Không có nguyên liệu nào</p>
                                    ) : (
                                        fridgeContents.ingredients.map((item, index) => (
                                            <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.ingredient?.name || `Nguyên liệu #${item.ingredient_id}`}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Số lượng: {item.quantity} {item.unit || ''}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm">Hết hạn:</p>
                                                    {formatExpiryDate(item.expiry_date)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'dishes' && (
                                <div className="space-y-2">
                                    {fridgeContents.dishes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">Không có món ăn nào</p>
                                    ) : (
                                        fridgeContents.dishes.map((item, index) => (
                                            <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.dish?.name || `Món ăn #${item.dish_id}`}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Số lượng: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm">Hết hạn:</p>
                                                    {formatExpiryDate(item.expiry_date)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RefrigeratorsPage;
