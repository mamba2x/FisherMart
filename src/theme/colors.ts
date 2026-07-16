// FisherMart Color Palette — Delta Blue & Mangrove Green
export const Colors = {
  // Primary — Delta river blue
  primary: '#0A6E9F',
  primaryLight: '#1A8DC5',
  primaryDark: '#064E73',

  // Secondary — Mangrove green
  secondary: '#2D8A4E',
  secondaryLight: '#3BAD63',
  secondaryDark: '#1E6035',

  // Accent — Sunset amber (fishing golden hour)
  accent: '#F4A23A',
  accentLight: '#F7BC6A',
  accentDark: '#C4811C',

  // Backgrounds
  background: '#F0F7FF',
  surface: '#FFFFFF',
  surfaceVariant: '#E8F4FD',
  card: '#FFFFFF',

  // Dark mode surfaces
  darkBackground: '#0D1B2A',
  darkSurface: '#1A2E3D',
  darkCard: '#223344',

  // Status
  success: '#27AE60',
  successLight: '#E8F8EE',
  warning: '#F39C12',
  warningLight: '#FEF9E7',
  error: '#E74C3C',
  errorLight: '#FDEDEC',
  offline: '#E74C3C',
  online: '#27AE60',

  // Text
  textPrimary: '#0D1B2A',
  textSecondary: '#5B7A91',
  textMuted: '#8FA9BC',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#D4E6F1',
  divider: '#EBF5FB',

  // Fish category colors
  freshFish: '#1A8DC5',
  driedFish: '#C4811C',
  smokedFish: '#7D5A3C',
  crayfish: '#E8642C',
  periwinkle: '#6C3483',

  // Gradients (start/end pairs)
  gradientPrimary: ['#0A6E9F', '#1A8DC5'] as [string, string],
  gradientSecondary: ['#2D8A4E', '#3BAD63'] as [string, string],
  gradientSunset: ['#F4A23A', '#E8642C'] as [string, string],
  gradientDark: ['#0D1B2A', '#1A2E3D'] as [string, string],

  // Shadows
  shadow: 'rgba(10, 110, 159, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(13, 27, 42, 0.6)',
};

export type ColorKey = keyof typeof Colors;
