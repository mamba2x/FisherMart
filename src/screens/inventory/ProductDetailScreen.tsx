import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProductById } from '../../services/inventoryService';
import { createOrder } from '../../services/orderService';
import { Product } from '../../database/types';
import { Colors, Typography, Spacing, BorderRadius, Shadow, CategoryColors, CategoryIcons } from '../../theme';

export const ProductDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProductById(productId).then(setProduct);
  }, [productId]);

  const handleOrder = () => {
    if (!product) return;
    Alert.prompt(
      'Place Order',
      `Enter buyer name and quantity of ${product.unit}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Order', onPress: async (input?: string) => {
            if (!input) return;
            await createOrder({
              product_id: product.id,
              product_name: product.name,
              buyer_name: input,
              buyer_phone: '',
              quantity: 1,
              unit: product.unit,
              total_price: product.price_per_unit,
              status: 'pending',
            });
            Alert.alert('Order Placed!', 'Your order has been recorded and will sync when online.');
          },
        },
      ],
      'plain-text'
    );
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Ionicons name="fish-outline" size={48} color={Colors.border} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = CategoryColors[product.category] ?? Colors.primary;
  const categoryIcon = CategoryIcons[product.category] ?? 'cube-outline';
  const totalValue = product.quantity * product.price_per_unit;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: categoryColor + '15' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Ionicons name={categoryIcon as any} size={96} color={categoryColor} />
          {product.sync_status === 'pending' && (
            <View style={styles.syncBadge}>
              <Ionicons name="cloud-upload-outline" size={12} color={Colors.textInverse} />
              <Text style={styles.syncBadgeText}>Not synced</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Category Tag */}
          <View style={[styles.catTag, { backgroundColor: categoryColor + '18' }]}>
            <Text style={[styles.catTagText, { color: categoryColor }]}>{product.category}</Text>
          </View>

          <Text style={styles.name}>{product.name}</Text>

          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          {/* Price & Stock */}
          <View style={styles.priceCard}>
            <View>
              <Text style={styles.priceLabel}>Price per {product.unit}</Text>
              <Text style={[styles.price, { color: categoryColor }]}>
                ₦{product.price_per_unit.toLocaleString('en-NG')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.priceLabel}>In Stock</Text>
              <Text style={styles.stock}>{product.quantity} {product.unit}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.priceLabel}>Total Value</Text>
              <Text style={styles.totalValue}>₦{totalValue.toLocaleString('en-NG')}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsCard}>
            {product.location && (
              <DetailRow icon="location-outline" label="Location" value={product.location} />
            )}
            {product.fisher_name && (
              <DetailRow icon="person-outline" label="Fisher" value={product.fisher_name} />
            )}
            {product.fisher_phone && (
              <DetailRow icon="call-outline" label="Phone" value={product.fisher_phone} />
            )}
            <DetailRow
              icon={product.is_available ? 'checkmark-circle-outline' : 'close-circle-outline'}
              label="Status"
              value={product.is_available ? 'Available for Sale' : 'Not Available'}
              valueColor={product.is_available ? Colors.success : Colors.error}
            />
            <DetailRow
              icon="cloud-outline"
              label="Sync Status"
              value={product.sync_status === 'synced' ? 'Synced to server' : 'Pending sync (saved locally)'}
              valueColor={product.sync_status === 'synced' ? Colors.success : Colors.warning}
            />
            <DetailRow
              icon="calendar-outline"
              label="Added"
              value={new Date(product.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={handleOrder}
            >
              <Ionicons name="cart-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.actionBtnText}>Place Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
              onPress={() => navigation.navigate('AddProduct', { product })}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow: React.FC<{
  icon: string; label: string; value: string; valueColor?: string;
}> = ({ icon, label, value, valueColor }) => (
  <View style={detailStyles.row}>
    <View style={detailStyles.iconWrap}>
      <Ionicons name={icon as any} size={16} color={Colors.textSecondary} />
    </View>
    <View style={detailStyles.textWrap}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  </View>
);

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  iconWrap: {
    width: 32, height: 32, backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textMuted },
  value: { ...Typography.labelMD, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  hero: {
    height: 220, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  syncBadge: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warning, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  syncBadgeText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700', fontSize: 10 },

  content: { padding: Spacing.base, gap: Spacing.base },

  catTag: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  catTagText: { ...Typography.labelSM, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, fontWeight: '800' },

  name: { ...Typography.headingXL, color: Colors.textPrimary },
  description: { ...Typography.bodyMD, color: Colors.textSecondary, lineHeight: 22 },

  priceCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, ...Shadow.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4 },
  price: { ...Typography.headingLG, fontWeight: '800' },
  stock: { ...Typography.headingSM, color: Colors.textPrimary, fontWeight: '700' },
  totalValue: { ...Typography.headingSM, color: Colors.accent, fontWeight: '800' },
  divider: { width: 1, height: 40, backgroundColor: Colors.border },

  detailsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadow.sm,
  },

  actions: { flexDirection: 'row', gap: Spacing.md, marginBottom: 32 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: BorderRadius.full,
    ...Shadow.md,
  },
  actionBtnText: { ...Typography.labelLG, color: Colors.textInverse },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.bodyMD, color: Colors.textMuted },
});
