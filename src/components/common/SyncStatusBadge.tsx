import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../theme';
import { SyncStatus } from '../../database/types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  onRetry?: () => void;
  showText?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  onRetry,
  showText = true,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'synced':
        return {
          bg: Colors.successLight + '20',
          color: Colors.success,
          icon: 'checkmark-circle-outline',
          text: 'Synced',
        };
      case 'syncing':
        return {
          bg: Colors.primaryLight + '20',
          color: Colors.primary,
          icon: 'sync-outline',
          text: 'Syncing',
        };
      case 'failed':
        return {
          bg: Colors.errorLight + '20',
          color: Colors.error,
          icon: 'close-circle-outline',
          text: 'Failed',
        };
      case 'pending':
      default:
        return {
          bg: Colors.warningLight + '20',
          color: Colors.warning,
          icon: 'cloud-upload-outline',
          text: 'Pending Sync',
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.container, { backgroundColor: badge.bg }]}>
      {status === 'syncing' ? (
        <ActivityIndicator size="small" color={badge.color} style={styles.spinner} />
      ) : (
        <Ionicons name={badge.icon as any} size={14} color={badge.color} />
      )}
      {showText && (
        <Text style={[styles.text, { color: badge.color }]}>{badge.text}</Text>
      )}
      {status === 'failed' && onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={13} color={badge.color} />
          <Text style={[styles.retryText, { color: badge.color }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
    alignSelf: 'flex-start',
  },
  spinner: {
    transform: [{ scale: 0.7 }],
    width: 14,
    height: 14,
  },
  text: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.1)',
    paddingLeft: 6,
    marginLeft: 2,
    gap: 2,
  },
  retryText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
  },
});
