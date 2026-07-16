import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
  trend?: { value: number; positive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, subtitle, icon, color, trend,
}) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <View style={styles.content}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trend}>
          <Ionicons
            name={trend.positive ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.positive ? Colors.success : Colors.error}
          />
          <Text style={[styles.trendText, { color: trend.positive ? Colors.success : Colors.error }]}>
            {trend.positive ? '+' : ''}{trend.value}% this week
          </Text>
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: 140,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  value: {
    ...Typography.headingMD,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trendText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
});
