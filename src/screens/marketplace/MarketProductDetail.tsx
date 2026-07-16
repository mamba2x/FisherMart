import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getProductById } from '../../services/inventoryService';
import { createOrder } from '../../services/orderService';
import { Product } from '../../database/types';
import { Colors, Typography, Spacing, BorderRadius, Shadow, CategoryColors, CategoryIcons } from '../../theme';
import { formatNaira, formatRelativeTime } from '../../utils/helpers';
import { useAuthStore } from '../../store/useAuthStore';

interface MarketProductDetailProps {
  route: { params: { productId: string } };
  navigation: any;
}

export const MarketProductDetail: React.FC<MarketProductDetailProps> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { profile } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderQty, setOrderQty] = useState(1);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    getProductById(productId).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [productId]);

  const handleCall = () => {
    if (!product?.fisher_phone) return;
    Linking.openURL(`tel:${product.fisher_phone}`);
  };

  const handleWhatsApp = () => {
    if (!product?.fisher_phone) return;
    const num = product.fisher_phone.replace(/^0/, '234');
    const msg = encodeURIComponent(`Hi, I'm interested in buying your ${product.name} on FisherMart.`);
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  };

  const handlePlaceOrder = async () => {
    if (!product) return;
    if (!profile) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.');
      return;
    }
    setOrdering(true);
    try {
      await createOrder({
        product_id: product.id,
        product_name: product.name,
        buyer_name: profile.name,
        buyer_phone: profile.phone,
        quantity: orderQty,
        unit: product.unit,
        total_price: orderQty * product.price_per_unit,
        status: 'pending',
        notes: '',
      });
      Alert.alert(
        '✅ Order Placed!',
        `Your order for ${orderQty} ${product.unit} of ${product.name} has been placed. The seller will contact you.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = CategoryColors[product.category] ?? Colors.primary;
  const categoryIcon = CategoryIcons[product.category] ?? 'fish';
  const total = orderQty * product.price_per_unit;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero / Image Area */}
        <LinearGradient
          colors={[categoryColor + '22', categoryColor + '08']}
          style={styles.hero}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Category icon */}
          <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={categoryIcon as any} size={64} color={categoryColor} />
          </View>

          {/* Availability badge */}
          <View style={[styles.availBadge, { backgroundColor: product.is_available ? Colors.success : Colors.error }]}>
            <Ionicons
              name={product.is_available ? 'checkmark-circle' : 'close-circle'}
              size={12}
              color={Colors.textInverse}
            />
            <Text style={styles.availText}>
              {product.is_available ? 'Available' : 'Sold Out'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Category Tag */}
          <View style={[styles.categoryTag, { backgroundColor: categoryColor + '18' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{product.category}</Text>
          </View>

          {/* Name & Price */}
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNaira(product.price_per_unit)}</Text>
            <Text style={styles.priceUnit}>/{product.unit}</Text>
          </View>

          {/* Meta info */}
          <View style={styles.metaCard}>
            <MetaRow icon="scale-outline" label="Stock" value={`${product.quantity} ${product.unit}`} />
            {product.location && (
              <MetaRow icon="location-outline" label="Location" value={product.location} />
            )}
            {product.fisher_name && (
              <MetaRow icon="person-outline" label="Seller" value={product.fisher_name} />
            )}
            <MetaRow icon="time-outline" label="Listed" value={formatRelativeTime(product.created_at)} />
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Contact Seller */}
          {product.fisher_phone && (
            <View style={styles.contactCard}>
              <Text style={styles.contactTitle}>Contact Seller</Text>
              <View style={styles.contactBtns}>
                <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                  <Ionicons name="call" size={18} color={Colors.textInverse} />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={18} color={Colors.textInverse} />
                  <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Order Section */}
          {product.is_available && (
            <View style={styles.orderCard}>
              <Text style={styles.orderTitle}>Place Order</Text>
              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Quantity ({product.unit})</Text>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQty(Math.max(1, orderQty - 1))}
                  >
                    <Ionicons name="remove" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{orderQty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQty(Math.min(product.quantity, orderQty + 1))}
                  >
                    <Ionicons name="add" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatNaira(total)}</Text>
              </View>

              <TouchableOpacity
                style={styles.orderBtn}
                onPress={handlePlaceOrder}
                disabled={ordering}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  style={styles.orderBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {ordering ? (
                    <ActivityIndicator color={Colors.textInverse} size="small" />
                  ) : (
                    <>
                      <Ionicons name="bag-handle" size={20} color={Colors.textInverse} />
                      <Text style={styles.orderBtnText}>Order Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MetaRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.metaRow}>
    <Ionicons name={icon as any} size={16} color={Colors.primary} />
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { ...Typography.headingSM, color: Colors.error },

  hero: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  backRow: { padding: Spacing.base },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availBadge: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  availText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700' },

  content: { padding: Spacing.base },

  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  categoryText: { ...Typography.labelSM, fontSize: 11 },

  productName: { ...Typography.headingXL, color: Colors.textPrimary, marginBottom: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginBottom: Spacing.lg },
  price: { ...Typography.price, color: Colors.primary, fontSize: 28 },
  priceUnit: { ...Typography.bodyMD, color: Colors.textMuted },

  metaCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base,
    ...Shadow.sm, marginBottom: Spacing.base,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  metaLabel: { ...Typography.caption, color: Colors.textMuted, width: 72 },
  metaValue: { ...Typography.labelMD, color: Colors.textPrimary, flex: 1 },

  descCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base,
    ...Shadow.sm, marginBottom: Spacing.base,
  },
  descTitle: { ...Typography.labelMD, color: Colors.textSecondary, marginBottom: Spacing.sm },
  descText: { ...Typography.bodyMD, color: Colors.textPrimary, lineHeight: 22 },

  contactCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base,
    ...Shadow.sm, marginBottom: Spacing.base,
  },
  contactTitle: { ...Typography.labelMD, color: Colors.textSecondary, marginBottom: Spacing.md },
  contactBtns: { flexDirection: 'row', gap: Spacing.md },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, ...Shadow.sm,
  },
  callBtnText: { ...Typography.labelMD, color: Colors.textInverse },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366', borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, ...Shadow.sm,
  },
  whatsappBtnText: { ...Typography.labelMD, color: Colors.textInverse },

  orderCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base,
    ...Shadow.md, marginBottom: Spacing.base,
  },
  orderTitle: { ...Typography.headingSM, color: Colors.textPrimary, marginBottom: Spacing.md },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  qtyLabel: { ...Typography.labelMD, color: Colors.textSecondary },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  qtyValue: { ...Typography.headingMD, color: Colors.textPrimary, minWidth: 32, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider, marginBottom: Spacing.lg,
  },
  totalLabel: { ...Typography.labelMD, color: Colors.textSecondary },
  totalValue: { ...Typography.headingLG, color: Colors.primary, fontWeight: '800' },
  orderBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.colored(Colors.primary) },
  orderBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg,
  },
  orderBtnText: { ...Typography.labelLG, color: Colors.textInverse },
});
