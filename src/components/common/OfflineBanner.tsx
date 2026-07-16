import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../theme';

interface OfflineBannerProps {
  isConnected: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isConnected }) => {
  const slideAnim = useRef(new Animated.Value(isConnected ? -60 : 0)).current;
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    if (prevConnected.current !== isConnected) {
      prevConnected.current = isConnected;
      Animated.spring(slideAnim, {
        toValue: isConnected ? -60 : 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [isConnected]);

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.textInverse} />
      <Text style={styles.text}>You're offline — changes will sync when connected</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  text: {
    ...Typography.labelMD,
    color: Colors.textInverse,
  },
});
