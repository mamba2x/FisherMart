import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSync } from '../../hooks/useSync';
import { useAuthStore } from '../../store/useAuthStore';
import { StatCard } from '../../components/common/StatCard';
import { SyncIndicator } from '../../components/common/SyncIndicator';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { ProductCard } from '../../components/common/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { getRevenueStats } from '../../services/orderService';

const formatPrice = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, fetchProducts, stats, fetchStats } = useInventoryStore();
  const { isSyncing, pendingCount, lastSyncTime, triggerSync, refreshPendingCount } = useSyncStore();
  const { isConnected } = useNetworkStatus();
  const { profile } = useAuthStore();
  useSync(); // Auto-sync when network reconnects

  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    pendingOrders: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await fetchProducts();
    await fetchStats();
    await refreshPendingCount();
    const rev = await getRevenueStats();
    setRevenueStats(rev);
  }, []);

  useEffect(() => { load(); }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isConnected && pendingCount > 0) {
      triggerSync();
    }
  }, [isConnected]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    if (isConnected) await triggerSync();
    setRefreshing(false);
  };

  const recentProducts = products.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfflineBanner isConnected={isConnected} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={Colors.gradientPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Good Morning 🌊</Text>
              <Text style={styles.heroTitle}>Fisher's Dashboard</Text>
              <Text style={styles.heroSub}>Delta State Blue Economy Market</Text>
            </View>
            <TouchableOpacity
              style={[styles.connBadge, { backgroundColor: isConnected ? Colors.success + '30' : Colors.error + '30' }]}
            >
              <Ionicons
                name={isConnected ? 'wifi' : 'wifi-outline'}
                size={14}
                color={isConnected ? '#6EE7A0' : '#FF9999'}
              />
              <Text style={[styles.connText, { color: isConnected ? '#6EE7A0' : '#FF9999' }]}>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>

          <SyncIndicator
            isSyncing={isSyncing}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
            onPress={() => isConnected ? triggerSync() : Alert.alert('Offline', 'Connect to internet to sync data')}
          />
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Today's Revenue"
              value={formatPrice(revenueStats.todayRevenue)}
              icon="cash-outline"
              color={Colors.success}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Pending Orders"
              value={String(revenueStats.pendingOrders)}
              subtitle="Tap to view orders"
              icon="receipt-outline"
              color={Colors.warning}
            />
          </View>
          <View style={[styles.statsGrid, { marginTop: Spacing.sm }]}>
            <StatCard
              title="Week Revenue"
              value={formatPrice(revenueStats.weekRevenue)}
              icon="trending-up-outline"
              color={Colors.primary}
            />
            <StatCard
              title="Total Products"
              value={String(stats.count)}
              subtitle={`Value: ${formatPrice(stats.totalValue)}`}
              icon="fish-outline"
              color={Colors.secondary}
            />
          </View>
        </View>

        {/* Pending Sync Alert */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.syncAlert}
            onPress={() => isConnected ? triggerSync() : null}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.warning} />
            <View style={styles.syncAlertText}>
              <Text style={styles.syncAlertTitle}>{pendingCount} items waiting to sync</Text>
              <Text style={styles.syncAlertSub}>
                {isConnected ? 'Tap to sync now' : 'Will sync when connected'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            {[
              { icon: 'add-circle', label: 'Add Catch', color: Colors.primary, screen: 'AddProduct' },
              { icon: 'storefront', label: 'Marketplace', color: Colors.secondary, screen: 'Marketplace' },
              { icon: 'receipt', label: 'Orders', color: Colors.warning, screen: 'Orders' },
              { icon: 'bar-chart', label: 'Analytics', color: Colors.accent, screen: 'Analytics' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionBtn}
                onPress={() => navigation.navigate(a.screen)}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                  <Ionicons name={a.icon as any} size={26} color={a.color} />
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Inventory */}
        {recentProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Inventory</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Inventory')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recentProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showSyncBadge
                  onPress={() => navigation.navigate('ProductDetail', { productId: p.id })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {products.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="fish-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No catch logged yet</Text>
            <Text style={styles.emptySub}>Start by adding your first fish inventory</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Text style={styles.emptyBtnText}>+ Add First Catch</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },

  hero: {
    margin: Spacing.base,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.base,
    ...Shadow.colored(Colors.primary),
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreeting: { ...Typography.bodySM, color: 'rgba(255,255,255,0.75)' },
  heroTitle: { ...Typography.headingXL, color: Colors.textInverse, marginTop: 2 },
  heroSub: { ...Typography.bodySM, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full,
  },
  connText: { ...Typography.labelSM, textTransform: 'none', fontWeight: '700', fontSize: 12 },

  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.headingSM, color: Colors.textPrimary, marginBottom: Spacing.md },
  seeAll: { ...Typography.labelMD, color: Colors.primary },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm },

  syncAlert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.warningLight, marginHorizontal: Spacing.base,
    marginTop: Spacing.base, borderRadius: BorderRadius.lg, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.warning + '40',
  },
  syncAlertText: { flex: 1 },
  syncAlertTitle: { ...Typography.labelMD, color: Colors.textPrimary },
  syncAlertSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: Spacing.sm, flex: 1 },
  actionIcon: { width: 58, height: 58, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography.labelSM, color: Colors.textPrimary, textTransform: 'none', letterSpacing: 0, fontSize: 12 },

  horizontalScroll: { marginLeft: -Spacing.base, paddingLeft: Spacing.base },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyTitle: { ...Typography.headingSM, color: Colors.textSecondary },
  emptySub: { ...Typography.bodyMD, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
  emptyBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.full, marginTop: Spacing.sm,
  },
  emptyBtnText: { ...Typography.labelLG, color: Colors.textInverse },
});
