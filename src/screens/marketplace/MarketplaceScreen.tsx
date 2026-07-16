import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMarketplaceProducts } from '../../services/inventoryService';
import { Product } from '../../database/types';
import { ProductCard } from '../../components/common/ProductCard';
import { Colors, Typography, Spacing, BorderRadius, Shadow, FISH_CATEGORIES } from '../../theme';

const ALL_CATEGORIES = ['All', ...FISH_CATEGORIES];

export const MarketplaceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getMarketplaceProducts(search, activeCategory === 'All' ? undefined : activeCategory);
    setProducts(data);
  };

  useEffect(() => { load(); }, [search, activeCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🛒 Marketplace</Text>
          <Text style={styles.sub}>{products.length} products available</Text>
        </View>
      </View>

      {/* Search Bar */}
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
      <FlatList
        horizontal
        data={ALL_CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={{ maxHeight: 48, marginBottom: Spacing.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeCategory === item && styles.tabActive]}
            onPress={() => setActiveCategory(item)}
          >
            <Text style={[styles.tabText, activeCategory === item && styles.tabTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Add products to see them here'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('MarketProductDetail', { productId: item.id })}
            activeOpacity={0.85}
          >
            {/* Mini product card */}
            <View style={styles.miniCard}>
              <View style={[styles.miniImageArea, { backgroundColor: Colors.primary + '12' }]}>
                <Ionicons name="fish" size={36} color={Colors.primary} />
                {!item.is_available && (
                  <View style={styles.unavailableBadge}>
                    <Text style={styles.unavailableText}>Sold Out</Text>
                  </View>
                )}
              </View>
              <View style={styles.miniInfo}>
                <Text style={styles.miniCategory}>{item.category}</Text>
                <Text style={styles.miniName} numberOfLines={2}>{item.name}</Text>
                {item.location && (
                  <View style={styles.miniLocation}>
                    <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.miniLocationText}>{item.location}</Text>
                  </View>
                )}
                <Text style={styles.miniPrice}>
                  ₦{item.price_per_unit.toLocaleString('en-NG')}
                  <Text style={styles.miniUnit}>/{item.unit}</Text>
                </Text>
                {item.fisher_name && (
                  <Text style={styles.miniFisher}>🧑‍🌾 {item.fisher_name}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing.md,
  },
  title: { ...Typography.headingXL, color: Colors.textPrimary },
  sub: { ...Typography.bodySM, color: Colors.textMuted, marginTop: 2 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, ...Shadow.sm,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.md, ...Typography.bodyMD, color: Colors.textPrimary },

  tabs: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  tabText: { ...Typography.labelSM, color: Colors.textSecondary, textTransform: 'none', letterSpacing: 0, fontSize: 13 },
  tabTextActive: { color: Colors.textInverse },

  grid: { padding: Spacing.base, paddingBottom: 32 },
  row: { justifyContent: 'space-between', gap: Spacing.md },

  gridItem: { flex: 0.5, marginBottom: Spacing.md },

  miniCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, ...Shadow.md, overflow: 'hidden',
  },
  miniImageArea: {
    height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  unavailableBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, alignItems: 'center',
  },
  unavailableText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700' },
  miniInfo: { padding: Spacing.md, gap: 4 },
  miniCategory: {
    ...Typography.caption, color: Colors.primary, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 9,
  },
  miniName: { ...Typography.headingSM, color: Colors.textPrimary, fontSize: 13 },
  miniLocation: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniLocationText: { ...Typography.caption, color: Colors.textMuted, fontSize: 11 },
  miniPrice: { ...Typography.headingSM, color: Colors.primary, fontWeight: '800', fontSize: 15 },
  miniUnit: { ...Typography.caption, color: Colors.textMuted, fontWeight: '400' },
  miniFisher: { ...Typography.caption, color: Colors.textSecondary, fontSize: 11 },

  empty: { alignItems: 'center', paddingVertical: Spacing.section, gap: Spacing.md },
  emptyTitle: { ...Typography.headingSM, color: Colors.textSecondary },
  emptySub: { ...Typography.bodySM, color: Colors.textMuted, textAlign: 'center' },
});
