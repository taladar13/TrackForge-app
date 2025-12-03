// File: src/features/profile/screens/LoginScreen.tsx

import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Input, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useLogin } from '../../../api/hooks';
import { useAuthStore } from '../../../store/authStore';
import { AuthStackParamList } from '../../../navigation/types';

interface LoginFormData {
  email: string;
  password: string;
}

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const loginMutation = useLogin();
  const setUser = useAuthStore((state) => state.setUser);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      setUser(response.user);
      // Navigation handled by RootNavigator when auth state changes
    } catch (error) {
      // Error will be displayed below via loginMutation.error
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>TrackForge</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              placeholder="Enter your email"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              error={errors.password?.message}
              placeholder="Enter your password"
            />
          )}
        />

        {loginMutation.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {loginMutation.error.message || 'Login failed. Please try again.'}
            </Text>
          </View>
        )}

        <Button
          title="Log In"
          onPress={handleSubmit(onSubmit)}
          loading={loginMutation.isPending}
          style={styles.button}
        />

        <Button
          title="Don't have an account? Sign up"
          onPress={() => navigation.navigate('Register')}
          variant="text"
          style={styles.linkButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  linkButton: {
    marginTop: spacing.md,
  },
});

