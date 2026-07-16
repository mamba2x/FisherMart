import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

interface SyncIndicatorProps {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  onPress: () => void;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isSyncing,
  pendingCount,
  lastSyncTime,
  onPress,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isSyncing) {
      animRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      spinAnim.setValue(0);
    }
  }, [isSyncing]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const d = new Date(lastSyncTime);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ rotate: isSyncing ? rotate : '0deg' }] }}>
        <Ionicons
          name={isSyncing ? 'sync' : pendingCount > 0 ? 'cloud-upload-outline' : 'checkmark-circle'}
          size={18}
          color={isSyncing ? Colors.primary : pendingCount > 0 ? Colors.warning : Colors.success}
        />
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>
          {isSyncing ? 'Syncing...' : pendingCount > 0 ? `${pendingCount} pending` : 'Synced'}
        </Text>
        <Text style={styles.time}>Last: {formatLastSync()}</Text>
      </View>

      {pendingCount > 0 && !isSyncing && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textContainer: {
    gap: 1,
  },
  label: {
    ...Typography.labelSM,
    color: Colors.textPrimary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  badge: {
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: 10,
  },
});
