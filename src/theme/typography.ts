import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  // When expo-google-fonts is added, replace with:
  // regular: 'Outfit_400Regular',
  // medium: 'Outfit_500Medium',
  // semiBold: 'Outfit_600SemiBold',
  // bold: 'Outfit_700Bold',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  xxl: 26,
  xxxl: 32,
  display: 40,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const Typography = {
  displayLarge: {
    fontSize: FontSize.display,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -1,
  } as TextStyle,

  displayMedium: {
    fontSize: FontSize.xxxl,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  } as TextStyle,

  // Aliases for convenience
  displayMD: {
    fontSize: FontSize.xxxl,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  } as TextStyle,

  headingXXL: {
    fontSize: FontSize.xxl,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  } as TextStyle,

  headingXL: {
    fontSize: FontSize.xxl,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  } as TextStyle,

  headingLG: {
    fontSize: FontSize.xl,
    fontWeight: '700' as TextStyle['fontWeight'],
  } as TextStyle,

  headingMD: {
    fontSize: FontSize.lg,
    fontWeight: '600' as TextStyle['fontWeight'],
  } as TextStyle,

  headingSM: {
    fontSize: FontSize.md,
    fontWeight: '600' as TextStyle['fontWeight'],
  } as TextStyle,

  bodyLG: {
    fontSize: FontSize.md,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: FontSize.md * 1.6,
  } as TextStyle,

  bodyMD: {
    fontSize: FontSize.base,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: FontSize.base * 1.6,
  } as TextStyle,

  bodySM: {
    fontSize: FontSize.sm,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: FontSize.sm * 1.6,
  } as TextStyle,

  labelLG: {
    fontSize: FontSize.base,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  } as TextStyle,

  labelMD: {
    fontSize: FontSize.sm,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.3,
  } as TextStyle,

  labelSM: {
    fontSize: FontSize.xs,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  } as TextStyle,

  caption: {
    fontSize: FontSize.xs,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.2,
  } as TextStyle,

  price: {
    fontSize: FontSize.xl,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  } as TextStyle,
};
