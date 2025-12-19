import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Users } from 'lucide-react';
import Select from '../components/common/Select';
import { fetchFamilies } from '../api/familyAPI';
import {
    getMonthlyCost,
    getCheckedItems,
    getTopIngredients,
    getTopIngredientsByCost,
    getFamilyStatistics
} from '../api/statisticsAPI';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <p className={`text-2xl font-bold ${color || 'text-gray-800'}`}>{value}</p>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color ? color.replace('text-', 'bg-').replace('600', '100') : 'bg-gray-100'}`}>
                <Icon size={24} className={color || 'text-gray-600'} />
            </div>
        </div>
    </div>
);

const ProgressBar = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="text-gray-500">{value.toLocaleString('vi-VN')}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color || 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
};

const StatisticsPage = () => {
    const [families, setFamilies] = useState([]);
    const [selectedFamilyId, setSelectedFamilyId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        monthlyCost: [],
        checkedItems: 0,
        totalItems: 0,
        topIngredients: [],
        topIngredientsByCost: [],
        familyStats: null
    });

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        loadFamilies();
    }, []);

    useEffect(() => {
        if (selectedFamilyId) {
            loadStatistics();
        }
    }, [selectedFamilyId, selectedYear]);

    const loadFamilies = async () => {
        try {
            const response = await fetchFamilies({ limit: 100 });
            const familiesData = response.data || response || [];
            setFamilies(familiesData);
            if (familiesData.length > 0) {
                setSelectedFamilyId(familiesData[0].id.toString());
            }
        } catch (error) {
            console.error('Error loading families:', error);
        }
    };

    const loadStatistics = async () => {
        if (!selectedFamilyId) return;

        setLoading(true);
        try {
            const [monthlyCostRes, checkedItemsRes, topIngredientsRes, topIngredientsCostRes, familyStatsRes] = await Promise.allSettled([
                getMonthlyCost(selectedYear, parseInt(selectedFamilyId)),
                getCheckedItems(parseInt(selectedFamilyId)),
                getTopIngredients(parseInt(selectedFamilyId), 10),
                getTopIngredientsByCost(parseInt(selectedFamilyId), 10),
                getFamilyStatistics(parseInt(selectedFamilyId))
            ]);

            setStats({
                monthlyCost: monthlyCostRes.status === 'fulfilled' ? (monthlyCostRes.value.data || monthlyCostRes.value || []) : [],
                checkedItems: checkedItemsRes.status === 'fulfilled' ? (checkedItemsRes.value.checked || checkedItemsRes.value.data?.checked || 0) : 0,
                totalItems: checkedItemsRes.status === 'fulfilled' ? (checkedItemsRes.value.total || checkedItemsRes.value.data?.total || 0) : 0,
                topIngredients: topIngredientsRes.status === 'fulfilled' ? (topIngredientsRes.value.data || topIngredientsRes.value || []) : [],
                topIngredientsByCost: topIngredientsCostRes.status === 'fulfilled' ? (topIngredientsCostRes.value.data || topIngredientsCostRes.value || []) : [],
                familyStats: familyStatsRes.status === 'fulfilled' ? (familyStatsRes.value.data || familyStatsRes.value) : null
            });
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalCost = () => {
        if (Array.isArray(stats.monthlyCost)) {
            return stats.monthlyCost.reduce((sum, item) => {
                const cost = parseFloat(item.total_cost) || parseFloat(item.cost) || 0;
                return sum + cost;
            }, 0);
        }
        return 0;
    };

    const getMaxIngredientValue = () => {
        if (stats.topIngredients.length === 0) return 1;
        return Math.max(...stats.topIngredients.map(i => parseFloat(i.total_quantity) || parseFloat(i.quantity) || 0));
    };

    const getMaxIngredientCostValue = () => {
        if (stats.topIngredientsByCost.length === 0) return 1;
        return Math.max(...stats.topIngredientsByCost.map(i => parseFloat(i.total_cost) || parseFloat(i.cost) || 0));
    };

    // Parse month string like '2024-12' to get month number (12)
    const parseMonthFromData = (monthValue) => {
        if (typeof monthValue === 'string' && monthValue.includes('-')) {
            return parseInt(monthValue.split('-')[1], 10);
        }
        return parseInt(monthValue) || 0;
    };

    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Thống kê mua sắm</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                <div className="flex flex-wrap gap-4">
                    <div className="min-w-[200px]">
                        <Select
                            label="Chọn gia đình"
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                            options={families.map(f => ({ value: f.id.toString(), label: f.name }))}
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <Select
                            label="Năm"
                            value={selectedYear.toString()}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                        />
                    </div>
                </div>
            </div>

            {!selectedFamilyId ? (
                <div className="text-center py-12 text-gray-500">
                    <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Vui lòng chọn gia đình để xem thống kê</p>
                </div>
            ) : loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="Tổng chi phí năm"
                            value={`${calculateTotalCost().toLocaleString('vi-VN')} đ`}
                            icon={DollarSign}
                            color="text-emerald-600"
                            subtitle={`Năm ${selectedYear}`}
                        />
                        <StatCard
                            title="Mục đã hoàn thành"
                            value={stats.checkedItems}
                            icon={ShoppingCart}
                            color="text-blue-600"
                            subtitle={`Trên tổng ${stats.totalItems} mục`}
                        />
                        <StatCard
                            title="Tỷ lệ hoàn thành"
                            value={stats.totalItems > 0 ? `${Math.round((stats.checkedItems / stats.totalItems) * 100)}%` : '0%'}
                            icon={TrendingUp}
                            color="text-purple-600"
                        />
                        <StatCard
                            title="Nguyên liệu theo dõi"
                            value={stats.topIngredients.length}
                            icon={Package}
                            color="text-orange-600"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Monthly Cost Chart */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 size={20} className="text-emerald-600" />
                                Chi phí theo tháng
                            </h2>
                            <div className="flex items-end justify-between h-48 gap-2">
                                {monthNames.map((month, index) => {
                                    const monthNumber = index + 1;
                                    const monthData = stats.monthlyCost.find(m => parseMonthFromData(m.month) === monthNumber);
                                    const value = parseFloat(monthData?.total_cost) || parseFloat(monthData?.cost) || 0;
                                    const maxValue = Math.max(...stats.monthlyCost.map(m => parseFloat(m.total_cost) || parseFloat(m.cost) || 0), 1);
                                    const height = (value / maxValue) * 100;

                                    return (
                                        <div key={month} className="flex-1 flex flex-col items-center">
                                            <div className="w-full flex flex-col items-center justify-end h-40">
                                                <div
                                                    className="w-full bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600"
                                                    style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                                                    title={`${value.toLocaleString('vi-VN')} đ`}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500 mt-2">{month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Ingredients by Quantity */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                                <Package size={20} className="text-blue-600" />
                                Top nguyên liệu (theo số lượng)
                            </h2>
                            <p className="text-xs text-gray-400 mb-4">Thống kê tất cả thời gian</p>
                            <div className="space-y-1">
                                {stats.topIngredients.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                                ) : (
                                    stats.topIngredients.slice(0, 5).map((item, index) => (
                                        <ProgressBar
                                            key={index}
                                            label={item.ingredient_name || item.name || `Nguyên liệu #${index + 1}`}
                                            value={parseFloat(item.total_quantity) || parseFloat(item.quantity) || 0}
                                            maxValue={getMaxIngredientValue()}
                                            color="bg-blue-500"
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Top Ingredients by Cost */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                            <DollarSign size={20} className="text-orange-600" />
                            Top nguyên liệu (theo chi phí)
                        </h2>
                        <p className="text-xs text-gray-400 mb-4">Thống kê tất cả thời gian</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            {stats.topIngredientsByCost.length === 0 ? (
                                <p className="text-gray-500 text-center py-8 col-span-2">Chưa có dữ liệu</p>
                            ) : (
                                stats.topIngredientsByCost.map((item, index) => {
                                    const cost = parseFloat(item.total_cost) || parseFloat(item.cost) || 0;
                                    return (
                                        <ProgressBar
                                            key={index}
                                            label={`${item.ingredient_name || item.name || `Nguyên liệu #${index + 1}`} (${cost.toLocaleString('vi-VN')} đ)`}
                                            value={cost}
                                            maxValue={getMaxIngredientCostValue()}
                                            color="bg-orange-500"
                                        />
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default StatisticsPage;
