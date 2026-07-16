import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../database/types';
import {
  Colors, Typography, Spacing, BorderRadius, Shadow, CategoryColors, CategoryIcons,
} from '../../theme';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showSyncBadge?: boolean;
  compact?: boolean;
}

const formatPrice = (n: number) =>
  `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showSyncBadge = false,
  compact = false,
}) => {
  const categoryColor = CategoryColors[product.category] ?? Colors.textSecondary;
  const categoryIcon = CategoryIcons[product.category] ?? 'cube-outline';

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.iconBox, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.compactMeta}>{product.quantity} {product.unit} · {product.location}</Text>
        </View>
        <View style={styles.compactRight}>
          <Text style={styles.compactPrice}>{formatPrice(product.price_per_unit)}</Text>
          <Text style={styles.compactPer}>/{product.unit}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header image / icon area */}
      <View style={[styles.imageArea, { backgroundColor: categoryColor + '15' }]}>
        <Ionicons name={categoryIcon as any} size={48} color={categoryColor} />
        {/* Sync status badge */}
        {showSyncBadge && product.sync_status === 'pending' && (
          <View style={styles.syncBadge}>
            <Ionicons name="cloud-upload-outline" size={12} color={Colors.textInverse} />
          </View>
        )}
        {/* Availability badge */}
        {!product.is_available && (
          <View style={[styles.syncBadge, { backgroundColor: Colors.error }]}>
            <Text style={styles.badgeText}>Unavailable</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Category tag */}
        <View style={[styles.categoryTag, { backgroundColor: categoryColor + '15' }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>{product.category}</Text>
        </View>

        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        {product.location && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.meta}>{product.location}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatPrice(product.price_per_unit)}</Text>
            <Text style={styles.per}>per {product.unit}</Text>
          </View>
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{product.quantity} {product.unit}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
    overflow: 'hidden',
    width: 180,
    marginRight: Spacing.md,
  },
  imageArea: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  syncBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 9,
  },
  info: {
    padding: Spacing.md,
    gap: 6,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    ...Typography.headingSM,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  price: {
    ...Typography.headingSM,
    color: Colors.primary,
    fontWeight: '800',
  },
  per: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  stockBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stockText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
    fontSize: 10,
  },

  // Compact styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    gap: 3,
  },
  compactName: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  compactMeta: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  compactPrice: {
    ...Typography.headingSM,
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  compactPer: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});
