// File: src/features/diet/screens/FoodSearchScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Input } from '../../../components';
import { colors, spacing, typography } from '../../../theme';
import { useSearchFoods, useLogDietItem } from '../../../api/hooks';
import { FoodItem } from '../../../types';

export const FoodSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { date } = (route.params as any) || { date: new Date().toISOString().split('T')[0] };
  
  const [searchQuery, setSearchQuery] = useState('');
  const { data: foods, isLoading } = useSearchFoods(searchQuery, true);
  const logItemMutation = useLogDietItem();

  const handleSelectFood = async (food: FoodItem) => {
    await logItemMutation.mutateAsync({
      foodId: food.id,
      quantity: 100, // Default quantity
      date,
      isAdHoc: true,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Search for food..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus
        style={styles.searchInput}
      />
      <FlatList
        data={foods || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.foodItem}
            onPress={() => handleSelectFood(item)}
          >
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodMacros}>
              {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading && searchQuery.length > 2 ? (
            <Text style={styles.emptyText}>No foods found</Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchInput: {
    margin: spacing.md,
  },
  foodItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  foodName: {
    ...typography.body,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  foodMacros: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

