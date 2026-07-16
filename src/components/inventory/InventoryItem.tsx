import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../database/types';
import { Colors, Typography, Spacing, BorderRadius, Shadow, CategoryColors, CategoryIcons } from '../../theme';
import { formatNaira, formatRelativeTime } from '../../utils/helpers';

interface InventoryItemProps {
  item: Product;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({
  item, onPress, onEdit, onDelete,
}) => {
  const categoryColor = CategoryColors[item.category] ?? Colors.primary;
  const categoryIcon = CategoryIcons[item.category] ?? 'fish';
  const isPending = item.sync_status === 'pending';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Left: Category Icon */}
      <View style={[styles.iconWrap, { backgroundColor: categoryColor + '18' }]}>
        <Ionicons name={categoryIcon as any} size={28} color={categoryColor} />
        {isPending && (
          <View style={styles.syncDot}>
            <Ionicons name="cloud-upload-outline" size={9} color={Colors.textInverse} />
          </View>
        )}
      </View>

      {/* Middle: Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.row}>
          <Text style={[styles.category, { color: categoryColor }]}>{item.category}</Text>
          {item.location ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.row}>
          <Text style={styles.qty}>{item.quantity} {item.unit}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.price}>{formatNaira(item.price_per_unit)}/{item.unit}</Text>
        </View>
        <Text style={styles.time}>{formatRelativeTime(item.updated_at)}</Text>
      </View>

      {/* Right: Actions + Availability */}
      <View style={styles.actions}>
        {/* Availability pill */}
        <View style={[
          styles.availPill,
          { backgroundColor: item.is_available ? Colors.success + '18' : Colors.error + '18' },
        ]}>
          <Text style={[
            styles.availText,
            { color: item.is_available ? Colors.success : Colors.error },
          ]}>
            {item.is_available ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {/* Edit / Delete buttons */}
        <View style={styles.btnRow}>
          {onEdit && (
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
              <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  syncDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },

  info: { flex: 1, gap: 3 },
  name: { ...Typography.labelLG, color: Colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  category: { ...Typography.caption, fontWeight: '700', textTransform: 'uppercase', fontSize: 9 },
  dot: { ...Typography.caption, color: Colors.textMuted },
  location: { ...Typography.caption, color: Colors.textMuted, flex: 1 },
  qty: { ...Typography.bodySM, color: Colors.textSecondary },
  price: { ...Typography.labelMD, color: Colors.primary },
  time: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

  actions: { alignItems: 'flex-end', gap: Spacing.sm, flexShrink: 0 },
  availPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  availText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  btnRow: { flexDirection: 'row', gap: Spacing.xs },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { backgroundColor: Colors.error + '12' },
});
