import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSyncStore } from '../../store/useSyncStore';
import { retryRecord } from '../../services/syncService';
import { ProductCard } from '../../components/common/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadow, FISH_CATEGORIES } from '../../theme';
import { Product } from '../../database/types';

const ALL_CATEGORIES = ['All', 'Failed Sync', ...FISH_CATEGORIES];

export const InventoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { products, fetchProducts, removeProduct } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts(
      activeCategory === 'All' || activeCategory === 'Failed Sync'
        ? undefined
        : activeCategory
    );
  }, [activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(
      activeCategory === 'All' || activeCategory === 'Failed Sync'
        ? undefined
        : activeCategory
    );
    setRefreshing(false);
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'Failed Sync') {
      return p.sync_status === 'failed';
    }
    return true;
  });

  const confirmDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Remove "${product.name}" from inventory? This will sync the deletion to the server when online.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => removeProduct(product.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Inventory</Text>
          <Text style={styles.sub}>{products.length} products listed</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search fish, location..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          data={ALL_CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeCategory === item && styles.tabActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.tabText, activeCategory === item && styles.tabTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="fish-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>Add your first catch or change the filter</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <TouchableOpacity
              style={styles.itemTouch}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              activeOpacity={0.85}
              onLongPress={() => confirmDelete(item)}
            >
              <ProductCard product={item} compact showSyncBadge />
            </TouchableOpacity>
            <View style={styles.itemActions}>
              {item.sync_status === 'failed' && (
                <TouchableOpacity
                  onPress={async () => {
                    await retryRecord(item.id, 'products');
                    useSyncStore.getState().triggerSync();
                    Alert.alert('Retrying', 'Sync retry triggered');
                  }}
                  style={[styles.editBtn, { backgroundColor: Colors.warningLight + '25' }]}
                >
                  <Ionicons name="refresh-outline" size={16} color={Colors.warning} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => navigation.navigate('AddProduct', { product: item })}
                style={styles.editBtn}
              >
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.md,
  },
  title: { ...Typography.headingXL, color: Colors.textPrimary },
  sub: { ...Typography.bodySM, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
    ...Shadow.colored(Colors.primary),
  },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1, paddingVertical: Spacing.md,
    ...Typography.bodyMD, color: Colors.textPrimary,
  },

  tabsWrapper: { marginBottom: Spacing.sm },
  tabs: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.labelSM, color: Colors.textSecondary, textTransform: 'none', letterSpacing: 0, fontSize: 13 },
  tabTextActive: { color: Colors.textInverse },

  list: { paddingHorizontal: Spacing.base, paddingBottom: 32 },

  itemWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  itemTouch: { flex: 1 },
  itemActions: { flexDirection: 'column', gap: Spacing.sm },
  editBtn: {
    width: 34, height: 34, backgroundColor: Colors.primaryLight + '18',
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 34, height: 34, backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center',
  },

  empty: { alignItems: 'center', paddingVertical: Spacing.section, gap: Spacing.md },
  emptyTitle: { ...Typography.headingSM, color: Colors.textSecondary },
  emptySub: { ...Typography.bodySM, color: Colors.textMuted, textAlign: 'center' },
});
