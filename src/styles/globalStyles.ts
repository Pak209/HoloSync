import { StyleSheet } from 'react-native';

// Color constants
export const colors = {
  // Primary colors
  primary: '#37C9FF',
  primaryDark: '#00cc6a',
  
  // Background colors
  background: '#000',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#2a2a2a',
  
  // Text colors
  textPrimary: '#fff',
  textSecondary: '#ccc',
  textMuted: '#666',
  textDisabled: '#444',
  
  // Border colors
  border: '#333',
  borderLight: '#444',
  
  // Status colors
  success: '#37C9FF',
  warning: '#ffa500',
  error: '#ff4444',
  info: '#00aaff',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

// Typography
export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Font weights
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Common component styles
export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  contentContainer: {
    flex: 1,
    padding: spacing.base,
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.base,
  },
  
  // Cards
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  cardHeader: {
    marginBottom: spacing.md,
  },
  
  // Buttons
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  buttonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  
  buttonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.background,
  },
  
  buttonTextSecondary: {
    color: colors.primary,
  },
  
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  
  // Text styles
  textPrimary: {
    color: colors.textPrimary,
    fontSize: typography.base,
  },
  
  textSecondary: {
    color: colors.textSecondary,
    fontSize: typography.base,
  },
  
  textMuted: {
    color: colors.textMuted,
    fontSize: typography.sm,
  },
  
  // Headers
  h1: {
    fontSize: typography['4xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  
  h2: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  
  h3: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  
  h4: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.base,
  },
  
  // Forms
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  
  inputFocused: {
    borderColor: colors.primary,
  },
  
  label: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing utilities
  mb_xs: { marginBottom: spacing.xs },
  mb_sm: { marginBottom: spacing.sm },
  mb_md: { marginBottom: spacing.md },
  mb_base: { marginBottom: spacing.base },
  mb_lg: { marginBottom: spacing.lg },
  mb_xl: { marginBottom: spacing.xl },
  
  mt_xs: { marginTop: spacing.xs },
  mt_sm: { marginTop: spacing.sm },
  mt_md: { marginTop: spacing.md },
  mt_base: { marginTop: spacing.base },
  mt_lg: { marginTop: spacing.lg },
  mt_xl: { marginTop: spacing.xl },
  
  mx_xs: { marginHorizontal: spacing.xs },
  mx_sm: { marginHorizontal: spacing.sm },
  mx_md: { marginHorizontal: spacing.md },
  mx_base: { marginHorizontal: spacing.base },
  mx_lg: { marginHorizontal: spacing.lg },
  mx_xl: { marginHorizontal: spacing.xl },
  
  my_xs: { marginVertical: spacing.xs },
  my_sm: { marginVertical: spacing.sm },
  my_md: { marginVertical: spacing.md },
  my_base: { marginVertical: spacing.base },
  my_lg: { marginVertical: spacing.lg },
  my_xl: { marginVertical: spacing.xl },
  
  p_xs: { padding: spacing.xs },
  p_sm: { padding: spacing.sm },
  p_md: { padding: spacing.md },
  p_base: { padding: spacing.base },
  p_lg: { padding: spacing.lg },
  p_xl: { padding: spacing.xl },
  
  // Shadows
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

// Helper functions for dynamic styles
export const createButtonStyle = (variant: 'primary' | 'secondary' | 'disabled' = 'primary') => {
  const baseStyle = globalStyles.button;
  
  switch (variant) {
    case 'secondary':
      return [baseStyle, globalStyles.buttonSecondary];
    case 'disabled':
      return [baseStyle, globalStyles.buttonDisabled];
    default:
      return baseStyle;
  }
};

export const createTextStyle = (size: keyof typeof typography, weight?: keyof typeof typography, color?: string) => {
  return {
    fontSize: typography[size],
    fontWeight: weight ? typography[weight] : typography.normal,
    color: color || colors.textPrimary,
  };
}; 