// File: src/components/ErrorView.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button title="Retry" onPress={onRetry} variant="outline" style={styles.button} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 16,
  },
});
