import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { COLORS } from '../../constants/themes';

const screenWidth = Dimensions.get('window').width;

const PIE_DATA = [
    {
        name: 'Thịt',
        population: 40,
        color: '#EF4444',
        legendFontColor: '#1F2937',
        legendFontSize: 14,
        legendFontFamily: 'System',
    },
    {
        name: 'Rau củ',
        population: 30,
        color: '#10B981',
        legendFontColor: '#1F2937',
        legendFontSize: 14,
        legendFontFamily: 'System',
    },
    {
        name: 'Hải sản',
        population: 20,
        color: '#3B82F6',
        legendFontColor: '#1F2937',
        legendFontSize: 14,
        legendFontFamily: 'System',
    },
    {
        name: 'Khác',
        population: 10,
        color: '#F59E0B',
        legendFontColor: '#1F2937',
        legendFontSize: 14,
        legendFontFamily: 'System',
    },
];

const LINE_DATA = {
    labels: ['1/11', '2/11', '3/11', '4/11', '5/11', '6/11', '7/11', '8/11', '9/11', '10/11', '11/11', '12/11', '13/11', '14/11', '15/11'],
    datasets: [
        {
            data: [200, 150, 450, 280, 800, 590, 430, 620, 350, 520, 480, 720, 650, 400, 550],
            color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
            strokeWidth: 3
        }
    ],
};

const CHART_CONFIG = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#A855F7"
    },
    propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: "#E5E7EB",
        strokeWidth: 1
    },
    propsForLabels: {
        fontFamily: 'System',
        fontSize: 10,
        fontWeight: '600',
    }
};

export default function SpendingCharts() {
    const data = LINE_DATA.datasets[0].data;
    const maxValue = Math.max(...data);
    const chartHeight = 220;
    const paddingLeft = 60;
    const paddingTop = 20;
    const paddingRight = 20;
    const chartWidth = screenWidth - 60;
    const dataWidth = chartWidth - paddingLeft - paddingRight;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
                    <Text style={styles.summaryValue}>3.320k đ</Text>
                    <Text style={styles.summarySubtext}>Tuần này</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.summaryLabel}>Trung bình / ngày</Text>
                    <Text style={styles.summaryValue}>474k đ</Text>
                    <Text style={styles.summarySubtext}>7 ngày</Text>
                </View>
            </View>

            {/* Pie Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Phân loại thực phẩm</Text>
                    <Text style={styles.chartSubtitle}>Theo % giá trị</Text>
                </View>
                <View style={styles.chartWrapper}>
                    <PieChart
                        data={PIE_DATA}
                        width={screenWidth - 60}
                        height={220}
                        chartConfig={CHART_CONFIG}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[0, 0]}
                        absolute
                        hasLegend={true}
                    />
                </View>
            </View>

            {/* Line Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Chi tiêu theo tuần</Text>
                    <Text style={styles.chartSubtitle}>Đơn vị: nghìn đồng</Text>
                </View>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    style={styles.chartScrollView}
                    contentContainerStyle={styles.chartScrollContent}
                >
                    <LineChart
                        data={LINE_DATA}
                        width={Math.max(screenWidth * 1.5, chartWidth * 1.5)} // Make the chart wider for horizontal scrolling
                        height={chartHeight}
                        chartConfig={CHART_CONFIG}
                        bezier
                        style={styles.lineChart}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withDots={true}
                        withShadow={false}
                        fromZero={true}
                        segments={4}
                        formatYLabel={(value) => `${value}k`}
                        decorator={() => {
                            return LINE_DATA.datasets[0].data.map((value, index) => {
                                if (value === undefined || value === null) return null;

                                // Calculate x position based on index and chart dimensions
                                const xPosition = (Math.max(screenWidth * 1.5, chartWidth * 1.5) - 120) / (LINE_DATA.labels.length - 1) * index + 60;
                                // Calculate y position based on value
                                const yPosition = chartHeight - 40 - ((value / maxValue) * (chartHeight - 60));

                                return (
                                    <View
                                        key={index}
                                        style={{
                                            position: 'absolute',
                                            left: xPosition - 20,
                                            top: yPosition - 30,
                                        }}
                                    >
                                        <View style={styles.valueLabel}>
                                            <Text style={styles.valueLabelText}>{value}k</Text>
                                        </View>
                                    </View>
                                );
                            });
                        }}
                    />
                </ScrollView>
                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
                        <Text style={styles.legendText}>Chi tiêu hằng ngày</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    chartContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    chartHeader: {
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartScrollView: {
        // Styles for the horizontal scroll view
        flexDirection: 'row',
    },
    chartScrollContent: {
        // Make the content wider to allow scrolling
        paddingRight: 50,
    },
    lineChart: {
        borderRadius: 16,
        paddingRight: 0,
    },
    legendContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    valueLabel: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 40,
        alignItems: 'center',
    },
    valueLabelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});