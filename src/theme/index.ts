import { ViewStyle } from 'react-native';
import { Colors } from './colors';
import { Typography, FontSize } from './typography';

export { Colors, Typography, FontSize };

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,

  colored: (color: string): ViewStyle => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  }),
};

export const CategoryColors: Record<string, string> = {
  'Fresh Fish': Colors.freshFish,
  'Dried Fish': Colors.driedFish,
  'Smoked Fish': Colors.smokedFish,
  'Crayfish': Colors.crayfish,
  'Periwinkle': Colors.periwinkle,
  'Other': Colors.textSecondary,
};

export const CategoryIcons: Record<string, string> = {
  'Fresh Fish': 'fish',
  'Dried Fish': 'sun',
  'Smoked Fish': 'flame',
  'Crayfish': 'alert-circle',
  'Periwinkle': 'disc',
  'Other': 'cube',
};

export const FISH_CATEGORIES = [
  'Fresh Fish',
  'Dried Fish',
  'Smoked Fish',
  'Crayfish',
  'Periwinkle',
  'Other',
] as const;

export type FishCategory = typeof FISH_CATEGORIES[number];
