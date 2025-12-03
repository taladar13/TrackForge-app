// File: src/theme/colors.ts

export const colors = {
  // Primary
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  
  // Secondary
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',
  
  // Accent
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FBBF24',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutrals
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceDark: '#F3F4F6',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  
  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Diet adherence colors
  adherenceGreen: '#10B981',
  adherenceYellow: '#F59E0B',
  adherenceRed: '#EF4444',
  
  // Dark mode (for future support)
  dark: {
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
  },
} as const;

export type ColorKey = keyof typeof colors;

