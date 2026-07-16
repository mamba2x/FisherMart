import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { getAllProducts } from '../../services/inventoryService';
import { getRevenueStats, getMonthlyRevenue } from '../../services/orderService';
import { Colors, Typography, Spacing, BorderRadius, Shadow, CategoryColors, FISH_CATEGORIES } from '../../theme';

const screenWidth = Dimensions.get('window').width - Spacing.base * 2;

export const AnalyticsScreen: React.FC = () => {
  const [revenueStats, setRevenueStats] = useState({ todayRevenue: 0, weekRevenue: 0, pendingOrders: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const rev = await getRevenueStats();
    setRevenueStats(rev);

    const monthly = await getMonthlyRevenue();
    setMonthlyRevenue(monthly.length > 0 ? monthly : [
      { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
    ]);

    const products = await getAllProducts();
    const catCounts: Record<string, number> = {};
    for (const p of products) {
      catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;
    }
    const pieData = Object.entries(catCounts).map(([name, count]) => ({
      name,
      count,
      color: CategoryColors[name] ?? Colors.textMuted,
      legendFontColor: Colors.textPrimary,
      legendFontSize: 12,
    }));
    setCategoryData(pieData);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const hasRevenue = monthlyRevenue.some((m) => m.revenue > 0);

  const chartConfig = {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 110, 159, ${opacity})`,
    labelColor: () => Colors.textSecondary,
    style: { borderRadius: 16 },
    propsForDotProps: { r: '5', strokeWidth: '2', stroke: Colors.primary },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>📊 Analytics</Text>
        <Text style={styles.sub}>Your business performance</Text>

        {/* Revenue Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
            <Text style={styles.summaryLabel}>Today</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              ₦{revenueStats.todayRevenue.toLocaleString('en-NG')}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.primary }]}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              ₦{revenueStats.weekRevenue.toLocaleString('en-NG')}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderTopColor: Colors.warning }]}>
            <Text style={styles.summaryLabel}>Pending Orders</Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {revenueStats.pendingOrders}
            </Text>
          </View>
        </View>

        {/* Monthly Revenue Chart */}
        {hasRevenue && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Monthly Revenue (₦)</Text>
            <LineChart
              data={{
                labels: monthlyRevenue.map((m) => m.month),
                datasets: [{ data: monthlyRevenue.map((m) => m.revenue || 0) }],
              }}
              width={screenWidth - Spacing.xl}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Category Distribution Pie */}
        {categoryData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Inventory by Category</Text>
            <PieChart
              data={categoryData}
              width={screenWidth - Spacing.xl}
              height={180}
              chartConfig={chartConfig}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="10"
              style={styles.chart}
            />
          </View>
        )}

        {categoryData.length === 0 && !hasRevenue && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>Add inventory and complete orders to see analytics</Text>
          </View>
        )}

        {/* Category Legend */}
        {categoryData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Product Breakdown</Text>
            {categoryData.map((cat) => (
              <View key={cat.name} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendName}>{cat.name}</Text>
                <Text style={styles.legendCount}>{cat.count} products</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: 32 },

  title: { ...Typography.headingXL, color: Colors.textPrimary, marginBottom: 2 },
  sub: { ...Typography.bodySM, color: Colors.textMuted, marginBottom: Spacing.lg },

  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  summaryCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadow.sm, borderTopWidth: 3, alignItems: 'center',
  },
  summaryLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  summaryValue: { ...Typography.headingSM, fontWeight: '800', fontSize: 14 },

  chartCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    ...Shadow.md, marginBottom: Spacing.base,
  },
  chartTitle: { ...Typography.headingSM, color: Colors.textPrimary, marginBottom: Spacing.md },
  chart: { borderRadius: BorderRadius.lg },

  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  legendDot: { width: 12, height: 12, borderRadius: BorderRadius.full },
  legendName: { ...Typography.labelMD, color: Colors.textPrimary, flex: 1 },
  legendCount: { ...Typography.bodySM, color: Colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: Spacing.section, gap: Spacing.md },
  emptyTitle: { ...Typography.headingSM, color: Colors.textSecondary },
  emptySub: { ...Typography.bodySM, color: Colors.textMuted, textAlign: 'center' },
});
