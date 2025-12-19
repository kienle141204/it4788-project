import React, { useState, useEffect } from 'react';
import { Eye, ShoppingCart, Check, X, Calendar, Users, ChevronDown, ChevronRight, Package } from 'lucide-react';
import Modal from '../components/common/Modal';
import Select from '../components/common/Select';
import Pagination from '../components/common/Pagination';
import { fetchShoppingLists, getShoppingListById } from '../api/shoppingListAPI';
import { fetchFamilies } from '../api/familyAPI';

const ShoppingListsPage = () => {
    const [shoppingLists, setShoppingLists] = useState([]);
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFamilyId, setSelectedFamilyId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedList, setSelectedList] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [expandedDates, setExpandedDates] = useState({});

    useEffect(() => {
        loadFamilies();
        loadShoppingLists();
    }, [currentPage]);

    const loadFamilies = async () => {
        try {
            const response = await fetchFamilies({ limit: 100 });
            const familiesData = response.data || response || [];
            setFamilies(familiesData);
        } catch (error) {
            console.error('Error loading families:', error);
        }
    };

    const loadShoppingLists = async () => {
        try {
            setLoading(true);
            const response = await fetchShoppingLists({
                page: currentPage,
                limit: itemsPerPage
            });

            let listsData = [];
            let responseTotalPages = 1;

            if (response && Array.isArray(response)) {
                listsData = response;
                responseTotalPages = 1;
            } else if (response && response.data) {
                listsData = response.data;
                responseTotalPages = response.pagination?.totalPages || 1;
            }

            // Sort by shopping_date descending
            listsData = [...listsData].sort((a, b) => {
                const dateA = new Date(a.shopping_date || a.created_at);
                const dateB = new Date(b.shopping_date || b.created_at);
                return dateB - dateA;
            });

            setShoppingLists(listsData);
            setTotalPages(responseTotalPages || 1);

            // Auto expand first 3 dates
            const grouped = groupByDate(listsData);
            const dateKeys = Object.keys(grouped).slice(0, 3);
            const expandState = {};
            dateKeys.forEach(key => expandState[key] = true);
            setExpandedDates(expandState);
        } catch (error) {
            console.error('Error loading shopping lists:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group by date
    const groupByDate = (lists) => {
        const grouped = {};
        lists.forEach(list => {
            const date = list.shopping_date || list.created_at;
            const dateKey = date ? new Date(date).toLocaleDateString('vi-VN') : 'Không có ngày';
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(list);
        });
        return grouped;
    };

    // Filter by family
    const filteredLists = selectedFamilyId === 'all'
        ? shoppingLists
        : shoppingLists.filter(list => list.family_id?.toString() === selectedFamilyId);

    const groupedLists = groupByDate(filteredLists);

    // Get family name by ID
    const getFamilyName = (familyId) => {
        if (!familyId) return 'Cá nhân';
        const family = families.find(f => f.id === familyId);
        return family?.name || `Gia đình #${familyId}`;
    };

    // Toggle date expansion
    const toggleDate = (dateKey) => {
        setExpandedDates(prev => ({
            ...prev,
            [dateKey]: !prev[dateKey]
        }));
    };

    const handleViewDetail = async (list) => {
        setIsDetailModalOpen(true);
        setDetailLoading(true);
        try {
            const response = await getShoppingListById(list.id);
            setSelectedList(response);
        } catch (error) {
            console.error('Error loading shopping list detail:', error);
            setSelectedList(list);
        } finally {
            setDetailLoading(false);
        }
    };

    // Calculate stats for a date group
    const getDateStats = (lists) => {
        const totalCost = lists.reduce((sum, list) => sum + (parseFloat(list.cost) || 0), 0);
        const familyCount = new Set(lists.map(l => l.family_id || 'personal')).size;
        return { totalCost, count: lists.length, familyCount };
    };

    if (loading && shoppingLists.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Danh sách mua sắm</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="min-w-[250px]">
                        <Select
                            label="Lọc theo gia đình"
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                            options={[
                                { value: 'all', label: 'Tất cả gia đình' },
                                ...families.map(f => ({ value: f.id.toString(), label: f.name }))
                            ]}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <ShoppingCart size={16} className="text-emerald-500" />
                            {filteredLists.length} danh sách
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar size={16} className="text-blue-500" />
                            {Object.keys(groupedLists).length} ngày
                        </span>
                    </div>
                </div>
            </div>

            {/* Grouped by Date */}
            <div className="space-y-4">
                {Object.keys(groupedLists).length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                        <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>Không có danh sách mua sắm nào</p>
                    </div>
                ) : (
                    Object.entries(groupedLists).map(([dateKey, lists]) => {
                        const stats = getDateStats(lists);
                        const isExpanded = expandedDates[dateKey];

                        return (
                            <div key={dateKey} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Date Header */}
                                <button
                                    onClick={() => toggleDate(dateKey)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                        <Calendar size={20} className="text-emerald-500" />
                                        <span className="font-semibold text-gray-800">{dateKey}</span>
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                                            {stats.count} danh sách
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-500">
                                            {stats.familyCount} gia đình
                                        </span>
                                        <span className="font-semibold text-emerald-600">
                                            {stats.totalCost.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </button>

                                {/* Lists for this date */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100">
                                        {lists.map((list) => (
                                            <div
                                                key={list.id}
                                                className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                        <ShoppingCart size={18} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800">
                                                                Danh sách #{list.id}
                                                            </span>
                                                            {list.is_shared && (
                                                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                                                                    Đã chia sẻ
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Users size={14} />
                                                                {getFamilyName(list.family_id)}
                                                            </span>
                                                            {list.items && (
                                                                <span className="flex items-center gap-1">
                                                                    <Package size={14} />
                                                                    {list.items.length} mục
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <p className="font-semibold text-emerald-600">
                                                            {parseFloat(list.cost || 0).toLocaleString('vi-VN')} đ
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {list.shopping_date ? new Date(list.shopping_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewDetail(list)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Chi tiết danh sách mua sắm #${selectedList?.id || ''}`}
                size="lg"
            >
                {detailLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                ) : selectedList ? (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Gia đình</p>
                                <p className="font-medium mt-1">{getFamilyName(selectedList.family_id)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Ngày mua sắm</p>
                                <p className="font-medium mt-1">
                                    {selectedList.shopping_date
                                        ? new Date(selectedList.shopping_date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Chưa đặt'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Tổng chi phí</p>
                                <p className="font-semibold text-emerald-600 text-lg mt-1">
                                    {parseFloat(selectedList.cost || 0).toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Trạng thái</p>
                                <p className="font-medium mt-1">
                                    {selectedList.is_shared ? (
                                        <span className="inline-flex items-center text-blue-600">
                                            <Check size={14} className="mr-1" /> Đã chia sẻ với gia đình
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">Chưa chia sẻ</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Chủ sở hữu</p>
                                <p className="font-medium mt-1">User #{selectedList.owner_id}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Ngày tạo</p>
                                <p className="font-medium mt-1">
                                    {selectedList.created_at
                                        ? new Date(selectedList.created_at).toLocaleDateString('vi-VN')
                                        : ''}
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Package size={18} />
                                Danh sách mua ({selectedList.items?.length || 0} mục)
                            </h3>

                            {selectedList.items && selectedList.items.length > 0 ? (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                    {selectedList.items.map((item, index) => (
                                        <div
                                            key={item.id || index}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${item.is_checked
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${item.is_checked
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-200 text-gray-400'
                                                    }`}>
                                                    {item.is_checked ? <Check size={14} /> : <span className="text-xs">{index + 1}</span>}
                                                </span>
                                                <div>
                                                    <p className={`font-medium ${item.is_checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                        {item.ingredient?.name || item.name || `Mục #${item.id}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {item.stock || item.quantity} {item.unit || ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-emerald-600">
                                                    {parseFloat(item.price || 0).toLocaleString('vi-VN')} đ
                                                </p>
                                                {item.is_checked && (
                                                    <span className="text-xs text-green-500">Đã mua</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    <Package size={32} className="mx-auto mb-2 text-gray-300" />
                                    <p>Chưa có mục nào trong danh sách</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default ShoppingListsPage;
