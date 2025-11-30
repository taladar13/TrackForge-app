// File: src/features/profile/screens/ProfileScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useMe, useLogout } from '../../../api/hooks';
import { useAuthStore } from '../../../store/authStore';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
  };

  const handleDeleteAccount = () => {
    // Placeholder - would implement account deletion
    alert('Account deletion not implemented in MVP');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.profileCard}>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.profile && (
          <View style={styles.profileInfo}>
            {user.profile.weight && (
              <Text style={styles.profileText}>Weight: {user.profile.weight}kg</Text>
            )}
            {user.profile.height && (
              <Text style={styles.profileText}>Height: {user.profile.height}cm</Text>
            )}
            {user.profile.goal && (
              <Text style={styles.profileText}>Goal: {user.profile.goal}</Text>
            )}
          </View>
        )}
      </Card>

      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('Profile' as any, { screen: 'EditProfile' })}
        variant="outline"
        style={styles.button}
      />

      <Button
        title="Log Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.button}
      />

      <Button
        title="Delete Account & Data"
        onPress={handleDeleteAccount}
        variant="text"
        style={[styles.button, styles.deleteButton]}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  email: {
    ...typography.h4,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  profileInfo: {
    marginTop: spacing.sm,
  },
  profileText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.xl,
  },
});

