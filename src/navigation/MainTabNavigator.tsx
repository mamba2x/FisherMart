import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { AddProductScreen } from '../screens/inventory/AddProductScreen';
import { ProductDetailScreen } from '../screens/inventory/ProductDetailScreen';
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { MarketProductDetail } from '../screens/marketplace/MarketProductDetail';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Colors, Typography, BorderRadius } from '../theme';

// ── Stacks ───────────────────────────────────────────────────────────────────
const HomeStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="AddProduct" component={AddProductScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Inventory" component={InventoryScreen} />
      <HomeStack.Screen name="Marketplace" component={MarketplaceScreen} />
      <HomeStack.Screen name="Orders" component={OrdersScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
    </HomeStack.Navigator>
  );
}

function InventoryTabs() {
  return (
    <InventoryStack.Navigator screenOptions={{ headerShown: false }}>
      <InventoryStack.Screen name="InventoryMain" component={InventoryScreen} />
      <InventoryStack.Screen name="AddProduct" component={AddProductScreen} />
      <InventoryStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </InventoryStack.Navigator>
  );
}

function MarketTabs() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="MarketplaceMain" component={MarketplaceScreen} />
      <MarketStack.Screen name="MarketProductDetail" component={MarketProductDetail} />
      <MarketStack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </MarketStack.Navigator>
  );
}

// ── Main Tab Navigator ─────────────────────────────────────────────────────
export const MainTabNavigator: React.FC = () => {
  const tabs = [
    { name: 'Home', component: HomeTabs, icon: 'home', label: 'Home' },
    { name: 'Inventory', component: InventoryTabs, icon: 'fish', label: 'Inventory' },
    { name: 'Market', component: MarketTabs, icon: 'storefront', label: 'Market' },
    { name: 'Orders', component: OrdersScreen, icon: 'receipt', label: 'Orders' },
    { name: 'Analytics', component: AnalyticsScreen, icon: 'bar-chart', label: 'Analytics' },
    { name: 'Profile', component: ProfileScreen, icon: 'person', label: 'Profile' },
  ] as const;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? (tab?.icon as any) : (`${tab?.icon}-outline` as any)}
              size={22}
              color={color}
            />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        };
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component as any}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  tabItem: {
    paddingTop: 4,
  },
});
