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
import { getFamilySharedLists } from '../api/shoppingListAPI';

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
    const [chartViewMode, setChartViewMode] = useState('month'); // 'day' or 'month'
    const [sortMode, setSortMode] = useState('quantity'); // 'quantity' or 'cost'
    const [shoppingLists, setShoppingLists] = useState([]);
    const [stats, setStats] = useState({
        monthlyCost: [],
        checkedItems: 0,
        totalItems: 0,
        topIngredients: [],
        topIngredientsByCost: [],
        familyStats: null,
        totalIngredientCost: 0,
        paidCost: 0,
        remainingCost: 0
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
        }
    };

    const loadStatistics = async () => {
        if (!selectedFamilyId) return;

        setLoading(true);
        try {
            const [monthlyCostRes, checkedItemsRes, topIngredientsRes, topIngredientsCostRes, familyStatsRes, shoppingListsRes] = await Promise.allSettled([
                getMonthlyCost(selectedYear, parseInt(selectedFamilyId)),
                getCheckedItems(parseInt(selectedFamilyId)),
                getTopIngredients(parseInt(selectedFamilyId), 10),
                getTopIngredientsByCost(parseInt(selectedFamilyId), 10),
                getFamilyStatistics(parseInt(selectedFamilyId)),
                getFamilySharedLists(parseInt(selectedFamilyId))
            ]);

            // Calculate costs from shopping lists (same as Frontend)
            // Filter by selected year
            let totalIngredientCost = 0;
            let paidCost = 0;
            let remainingCost = 0;
            let checkedItems = 0;
            let totalItems = 0;

            if (shoppingListsRes.status === 'fulfilled') {
                const familyLists = shoppingListsRes.value.data || shoppingListsRes.value || [];
                
                // Filter shopping lists by selected year
                const filteredLists = Array.isArray(familyLists) ? familyLists.filter((list) => {
                    const listDate = list.shopping_date || list.created_at;
                    if (!listDate) return false;
                    const date = new Date(listDate);
                    return date.getFullYear() === selectedYear;
                }) : [];
                
                // Store filtered lists for daily chart
                setShoppingLists(filteredLists);
                
                if (Array.isArray(filteredLists)) {
                    filteredLists.forEach((list) => {
                        if (Array.isArray(list.items)) {
                            totalItems += list.items.length;
                            const checked = list.items.filter((item) => item.is_checked === true);
                            checkedItems += checked.length;
                            
                            list.items.forEach((item) => {
                                // Tính giá tiền: (price/kg * stock/gram) / 1000
                                const price = Number(item.price) || Number(item.ingredient?.price) || 0;
                                const stock = Number(item.stock) || 0;
                                const itemCost = (price * stock) / 1000;

                                totalIngredientCost += itemCost;

                                if (item.is_checked) {
                                    paidCost += itemCost;
                                } else {
                                    remainingCost += itemCost;
                                }
                            });
                        }
                    });
                }
            }

            setStats({
                monthlyCost: monthlyCostRes.status === 'fulfilled' ? (monthlyCostRes.value.data || monthlyCostRes.value || []) : [],
                // Use calculated values from filtered shopping lists by year
                checkedItems: checkedItems,
                totalItems: totalItems,
                topIngredients: topIngredientsRes.status === 'fulfilled' ? (topIngredientsRes.value.data || topIngredientsRes.value || []) : [],
                topIngredientsByCost: topIngredientsCostRes.status === 'fulfilled' ? (topIngredientsCostRes.value.data || topIngredientsCostRes.value || []) : [],
                familyStats: familyStatsRes.status === 'fulfilled' ? (familyStatsRes.value.data || familyStatsRes.value) : null,
                totalIngredientCost: Math.round(totalIngredientCost),
                paidCost: Math.round(paidCost),
                remainingCost: Math.round(remainingCost)
            });
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalCost = () => {
        // Use totalIngredientCost calculated from shopping lists (same as Frontend)
        return stats.totalIngredientCost || 0;
    };

    // Parse month string like '2024-12' to get month number (12)
    const parseMonthFromData = (monthValue) => {
        if (typeof monthValue === 'string' && monthValue.includes('-')) {
            return parseInt(monthValue.split('-')[1], 10);
        }
        return parseInt(monthValue) || 0;
    };

    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

    // Prepare daily chart data from shopping lists
    const prepareDailyChartData = () => {
        if (!shoppingLists || shoppingLists.length === 0) {
            return null;
        }

        // Group by date and filter by selected year
        const dailyMap = new Map();
        
        shoppingLists.forEach((list) => {
            if (list.shopping_date) {
                const date = new Date(list.shopping_date);
                // Only include dates from selected year
                if (date.getFullYear() === selectedYear) {
                    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    const cost = Number(list.cost) || 0;
                    
                    if (dailyMap.has(dateKey)) {
                        dailyMap.set(dateKey, dailyMap.get(dateKey) + cost);
                    } else {
                        dailyMap.set(dateKey, cost);
                    }
                }
            }
        });

        // Sort by date and get last 7 days in selected year or all if less than 7
        const sortedEntries = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-7); // Last 7 days in selected year

        if (sortedEntries.length === 0) {
            return null;
        }

        const labels = sortedEntries.map(([date]) => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        const data = sortedEntries.map(([, cost]) => cost);

        return { labels, data };
    };

    // Prepare monthly chart data
    const prepareMonthlyChartData = () => {
        if (stats.monthlyCost.length === 0) {
            return null;
        }

        const monthData = monthNames.map((_, index) => {
            const monthNumber = index + 1;
            const monthDataItem = stats.monthlyCost.find(m => parseMonthFromData(m.month) === monthNumber);
            return parseFloat(monthDataItem?.total_cost) || parseFloat(monthDataItem?.cost) || 0;
        });

        return {
            labels: monthNames,
            data: monthData
        };
    };

    const chartData = chartViewMode === 'day' 
        ? prepareDailyChartData() 
        : prepareMonthlyChartData();

    // Sort top ingredients based on sort mode
    const sortedTopIngredients = sortMode === 'cost' 
        ? [...stats.topIngredientsByCost].sort((a, b) => {
            const costA = parseFloat(a.total_cost) || parseFloat(a.cost) || 0;
            const costB = parseFloat(b.total_cost) || parseFloat(b.cost) || 0;
            return costB - costA;
        })
        : [...stats.topIngredients].sort((a, b) => {
            const qtyA = parseFloat(a.total_quantity) || parseFloat(a.quantity) || 0;
            const qtyB = parseFloat(b.total_quantity) || parseFloat(b.quantity) || 0;
            return qtyB - qtyA;
        });

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
                            title="Tổng tiền nguyên liệu"
                            value={`${stats.totalIngredientCost.toLocaleString('vi-VN')} đ`}
                            icon={DollarSign}
                            color="text-purple-600"
                        />
                        <StatCard
                            title="Tiền đã chi"
                            value={`${stats.paidCost.toLocaleString('vi-VN')} đ`}
                            icon={ShoppingCart}
                            color="text-emerald-600"
                        />
                        <StatCard
                            title="Tiền cần chi"
                            value={`${stats.remainingCost.toLocaleString('vi-VN')} đ`}
                            icon={TrendingUp}
                            color="text-orange-600"
                        />
                        <StatCard
                            title="Tổng mặt hàng"
                            value={stats.totalItems}
                            icon={Package}
                            color="text-blue-600"
                            subtitle={`Đã mua: ${stats.checkedItems}`}
                        />
                    </div>
                    
                    {/* Additional Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            title="Tỷ lệ hoàn thành"
                            value={stats.totalItems > 0 ? `${Math.round((stats.checkedItems / stats.totalItems) * 100)}%` : '0%'}
                            icon={Users}
                            color="text-purple-600"
                        />
                        <StatCard
                            title="Tổng chi phí năm"
                            value={`${calculateTotalCost().toLocaleString('vi-VN')} đ`}
                            icon={DollarSign}
                            color="text-emerald-600"
                            subtitle={`Năm ${selectedYear}`}
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
                        {/* Cost Chart (Daily/Monthly) */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <BarChart3 size={20} className="text-emerald-600" />
                                    Chi tiêu theo {chartViewMode === 'day' ? 'ngày' : 'tháng'}
                                </h2>
                                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setChartViewMode('day')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            chartViewMode === 'day'
                                                ? 'bg-emerald-500 text-white'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Ngày
                                    </button>
                                    <button
                                        onClick={() => setChartViewMode('month')}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            chartViewMode === 'month'
                                                ? 'bg-emerald-500 text-white'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Tháng
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">Đơn vị: đồng (đ)</p>
                            {chartData && chartData.data && chartData.data.some(v => v > 0) ? (
                                <div className="flex gap-3 h-64">
                                    {/* Y-axis */}
                                    <div className="flex flex-col justify-between h-56 pb-6">
                                        {(() => {
                                            const maxValue = Math.max(...chartData.data, 1);
                                            const steps = 5;
                                            const stepValue = maxValue / steps;
                                            const yAxisValues = [];
                                            for (let i = steps; i >= 0; i--) {
                                                yAxisValues.push(Math.round(stepValue * i));
                                            }
                                            return yAxisValues.map((val, idx) => (
                                                <span key={idx} className="text-xs text-gray-500 text-right min-w-[50px]">
                                                    {val.toLocaleString('vi-VN')}
                                                </span>
                                            ));
                                        })()}
                                    </div>
                                    
                                    {/* Chart bars */}
                                    <div className="flex-1 flex items-end justify-between gap-2 relative">
                                        {chartData.labels.map((label, index) => {
                                            const value = chartData.data[index] || 0;
                                            const maxValue = Math.max(...chartData.data, 1);
                                            const height = (value / maxValue) * 100;

                                            return (
                                                <div key={index} className="flex-1 flex flex-col items-center relative">
                                                    {/* Value label on top */}
                                                    {value > 0 && (
                                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                                                {value.toLocaleString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Bar container */}
                                                    <div className="w-full flex flex-col items-center justify-end h-56 pb-6 relative">
                                                        <div
                                                            className="w-full bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600 relative"
                                                            style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                                                            title={`${value.toLocaleString('vi-VN')} đ`}
                                                        />
                                                    </div>
                                                    
                                                    {/* X-axis label */}
                                                    <span className="text-xs text-gray-500 mt-1">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-gray-500">
                                    <p>Chưa có dữ liệu chi tiêu</p>
                                </div>
                            )}
                        </div>

                        {/* Top Ingredients */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Package size={20} className="text-blue-600" />
                                    Top nguyên liệu mua nhiều
                                </h2>
                                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setSortMode('quantity')}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            sortMode === 'quantity'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Số lượng
                                    </button>
                                    <button
                                        onClick={() => setSortMode('cost')}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            sortMode === 'cost'
                                                ? 'bg-blue-500 text-white'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        Số tiền
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                {sortMode === 'quantity' ? 'Theo số lượng (gram)' : 'Theo số tiền đã mua'}
                            </p>
                            <div className="space-y-1">
                                {sortedTopIngredients.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                                ) : (
                                    sortedTopIngredients.slice(0, 5).map((item, index) => {
                                        if (sortMode === 'cost') {
                                            const cost = parseFloat(item.total_cost) || parseFloat(item.cost) || 0;
                                            const maxCost = Math.max(...sortedTopIngredients.slice(0, 5).map(i => parseFloat(i.total_cost) || parseFloat(i.cost) || 0), 1);
                                            return (
                                                <ProgressBar
                                                    key={index}
                                                    label={`${item.ingredient_name || item.name || `Nguyên liệu #${index + 1}`} (${cost.toLocaleString('vi-VN')} đ)`}
                                                    value={cost}
                                                    maxValue={maxCost}
                                                    color="bg-orange-500"
                                                />
                                            );
                                        } else {
                                            const quantity = parseFloat(item.total_quantity) || parseFloat(item.quantity) || 0;
                                            const maxQty = Math.max(...sortedTopIngredients.slice(0, 5).map(i => parseFloat(i.total_quantity) || parseFloat(i.quantity) || 0), 1);
                                            return (
                                                <ProgressBar
                                                    key={index}
                                                    label={`${item.ingredient_name || item.name || `Nguyên liệu #${index + 1}`} (${quantity.toLocaleString('vi-VN')}g)`}
                                                    value={quantity}
                                                    maxValue={maxQty}
                                                    color="bg-blue-500"
                                                />
                                            );
                                        }
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default StatisticsPage;
