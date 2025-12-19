// File: src/components/Card.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, onPress, style, variant = 'default' }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        variant === 'outlined' && styles.outlined,
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
