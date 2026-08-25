import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase } from '../database/db';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useSyncStore } from '../store/useSyncStore';
import { ensureAnonymousSession } from '../services/authService';
import { Colors, Typography } from '../theme';

type AppPhase = 'splash' | 'loading' | 'ready';

export const AppNavigator: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [dbError, setDbError] = useState<string | null>(null);

  const { isLoggedIn, initAuth, loading: authLoading } = useAuthStore();

  // After splash finishes → initialize DB + auth session + sync metadata
  const handleSplashFinish = async () => {
    setPhase('loading');
    try {
      await initializeDatabase();
      await initAuth();
      await ensureAnonymousSession();
      
      // Auto-trigger sync on start if pending items exist
      const store = useSyncStore.getState();
      await store.refreshPendingCount();
      if (store.pendingCount > 0) {
        store.triggerSync();
      }
    } catch (e: any) {
      setDbError(e.message);
    } finally {
      setPhase('ready');
    }
  };

  if (phase === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (phase === 'loading' || authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up FisherMart...</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorMsg}>{dbError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          {isLoggedIn ? <MainTabNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: { ...Typography.bodyMD, color: Colors.textSecondary },
  errorTitle: { ...Typography.headingSM, color: Colors.error },
  errorMsg: {
    ...Typography.bodySM,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
