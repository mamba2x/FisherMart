import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../theme';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wave animation (looping)
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    // Sequence: logo → name → tagline → navigate
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // App name fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      // Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      // Hold, then navigate
      Animated.delay(900),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative Wave Circles */}
      <Animated.View
        style={[styles.wave, styles.wave1, { transform: [{ translateY: waveTranslate }] }]}
      />
      <Animated.View
        style={[styles.wave, styles.wave2, { transform: [{ translateY: waveTranslate }] }]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="fish" size={56} color={Colors.primary} />
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>{APP_NAME}</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity, alignItems: 'center' }}>
        <Text style={styles.tagline}>Offline-first marketplace</Text>
        <Text style={styles.taglineSub}>for Delta State fishers</Text>
      </Animated.View>

      {/* Bottom info */}
      <View style={styles.bottom}>
        <View style={styles.badge}>
          <Ionicons name="cloud-offline-outline" size={14} color={Colors.textInverse} />
          <Text style={styles.badgeText}>Works Offline</Text>
        </View>
        <Text style={styles.version}>v{APP_VERSION}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  wave: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.1,
    backgroundColor: Colors.textInverse,
  },
  wave1: { width: width * 1.5, height: width * 1.5, top: -width * 0.7, left: -width * 0.25 },
  wave2: { width: width * 1.2, height: width * 1.2, bottom: -width * 0.7, right: -width * 0.3 },

  logoWrap: { marginBottom: Spacing.md },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },

  appName: {
    ...Typography.displayMD,
    color: Colors.textInverse,
    letterSpacing: 2,
    fontWeight: '800',
  },
  tagline: {
    ...Typography.bodyLG,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  taglineSub: {
    ...Typography.bodySM,
    color: 'rgba(255,255,255,0.6)',
  },

  bottom: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
  },
  badgeText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '600' },
  version: { ...Typography.caption, color: 'rgba(255,255,255,0.5)' },
});
