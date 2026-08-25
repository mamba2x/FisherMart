import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllOrders, updateOrderStatus } from '../../services/orderService';
import { retryRecord } from '../../services/syncService';
import { useSyncStore } from '../../store/useSyncStore';
import { SyncStatusBadge } from '../../components/common/SyncStatusBadge';
import { Order, OrderStatus } from '../../database/types';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Rejected', value: 'rejected' },
];

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.primary,
  delivered: Colors.success,
  rejected: Colors.error,
  cancelled: Colors.textMuted,
};

const STATUS_ICON: Record<string, string> = {
  pending: 'time-outline',
  accepted: 'checkmark-circle-outline',
  delivered: 'cube-outline',
  rejected: 'close-circle-outline',
  cancelled: 'ban-outline',
};

export const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getAllOrders(activeTab === 'all' ? undefined : activeTab);
    setOrders(data);
  };

  useEffect(() => { load(); }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    await updateOrderStatus(order.id, status);
    load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Orders</Text>
        <Text style={styles.sub}>{orders.length} orders</Text>
      </View>

      {/* Status Tabs */}
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(t) => t.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{ maxHeight: 48, marginBottom: Spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item.value && styles.tabActive]}
            onPress={() => setActiveTab(item.value)}
          >
            <Text style={[styles.tabText, activeTab === item.value && styles.tabTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Orders from buyers will appear here</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = STATUS_COLOR[item.status] ?? Colors.textMuted;
          return (
            <View style={styles.orderCard}>
              {/* Header */}
              <View style={styles.orderHeader}>
                <View style={[styles.statusBadge, { backgroundColor: color + '18' }]}>
                  <Ionicons name={STATUS_ICON[item.status] as any} size={13} color={color} />
                  <Text style={[styles.statusText, { color }]}>{item.status.toUpperCase()}</Text>
                </View>
                <SyncStatusBadge
                  status={item.sync_status}
                  showText={false}
                  onRetry={
                    item.sync_status === 'failed'
                      ? async () => {
                          await retryRecord(item.id, 'orders');
                          useSyncStore.getState().triggerSync();
                        }
                      : undefined
                  }
                />
                <Text style={styles.orderDate}>
                  {new Date(item.created_at).toLocaleDateString('en-NG', { dateStyle: 'short' })}
                </Text>
              </View>

              {/* Body */}
              <Text style={styles.productName}>{item.product_name}</Text>
              <View style={styles.orderRow}>
                <View style={styles.orderDetail}>
                  <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.orderDetailText}>{item.buyer_name || 'Anonymous'}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Ionicons name="scale-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.orderDetailText}>{item.quantity} {item.unit}</Text>
                </View>
                <Text style={styles.orderPrice}>₦{item.total_price.toLocaleString('en-NG')}</Text>
              </View>

              {/* Actions */}
              {item.status === 'pending' && (
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={[styles.orderActionBtn, { backgroundColor: Colors.successLight, borderColor: Colors.success }]}
                    onPress={() => changeStatus(item, 'accepted')}
                  >
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                    <Text style={[styles.orderActionText, { color: Colors.success }]}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.orderActionBtn, { backgroundColor: Colors.errorLight, borderColor: Colors.error }]}
                    onPress={() => changeStatus(item, 'rejected')}
                  >
                    <Ionicons name="close" size={14} color={Colors.error} />
                    <Text style={[styles.orderActionText, { color: Colors.error }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'accepted' && (
                <TouchableOpacity
                  style={[styles.deliverBtn]}
                  onPress={() => changeStatus(item, 'delivered')}
                >
                  <Ionicons name="cube-outline" size={14} color={Colors.textInverse} />
                  <Text style={styles.deliverBtnText}>Mark as Delivered</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.sm },
  title: { ...Typography.headingXL, color: Colors.textPrimary },
  sub: { ...Typography.bodySM, color: Colors.textMuted },

  tabs: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.labelSM, color: Colors.textSecondary, textTransform: 'none', letterSpacing: 0, fontSize: 13 },
  tabTextActive: { color: Colors.textInverse },

  list: { padding: Spacing.base, gap: Spacing.md, paddingBottom: 32 },

  orderCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base,
    ...Shadow.md, gap: Spacing.sm,
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  statusText: { ...Typography.labelSM, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  syncBadge: {
    width: 24, height: 24, borderRadius: BorderRadius.full,
    backgroundColor: Colors.warningLight, alignItems: 'center', justifyContent: 'center',
  },
  orderDate: { ...Typography.caption, color: Colors.textMuted, marginLeft: 'auto' },

  productName: { ...Typography.headingSM, color: Colors.textPrimary },

  orderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  orderDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDetailText: { ...Typography.bodySM, color: Colors.textSecondary },
  orderPrice: { ...Typography.headingSM, color: Colors.primary, fontWeight: '800', marginLeft: 'auto' },

  orderActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  orderActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  orderActionText: { ...Typography.labelMD, fontWeight: '700' },

  deliverBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.secondary, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, marginTop: Spacing.sm,
  },
  deliverBtnText: { ...Typography.labelMD, color: Colors.textInverse },

  empty: { alignItems: 'center', paddingVertical: Spacing.section, gap: Spacing.md },
  emptyTitle: { ...Typography.headingSM, color: Colors.textSecondary },
  emptySub: { ...Typography.bodySM, color: Colors.textMuted, textAlign: 'center' },
});
