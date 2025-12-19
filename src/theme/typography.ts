// File: src/theme/typography.ts

import { TextStyle } from 'react-native';

// Use React Native's expected fontWeight type
type FontWeight = TextStyle['fontWeight'];

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    semibold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    regular: '400' as FontWeight,
    medium: '500' as FontWeight,
    semibold: '600' as FontWeight,
    bold: '700' as FontWeight,
  },
} as const;

// Pre-calculated text styles with proper types
export const textStyles: Record<string, TextStyle> = {
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '700',
    lineHeight: Math.round(typography.fontSize['4xl'] * typography.lineHeight.tight),
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    lineHeight: Math.round(typography.fontSize['3xl'] * typography.lineHeight.tight),
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '600',
    lineHeight: Math.round(typography.fontSize['2xl'] * typography.lineHeight.normal),
  },
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    lineHeight: Math.round(typography.fontSize.xl * typography.lineHeight.normal),
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',
    lineHeight: Math.round(typography.fontSize.base * typography.lineHeight.normal),
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
    lineHeight: Math.round(typography.fontSize.sm * typography.lineHeight.normal),
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: '400',
    lineHeight: Math.round(typography.fontSize.xs * typography.lineHeight.normal),
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    lineHeight: Math.round(typography.fontSize.base * typography.lineHeight.normal),
  },
};
