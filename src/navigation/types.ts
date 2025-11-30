// File: src/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Today: NavigatorScreenParams<TodayStackParamList>;
  Diet: NavigatorScreenParams<DietStackParamList>;
  Workout: NavigatorScreenParams<WorkoutStackParamList>;
  Progress: NavigatorScreenParams<ProgressStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type TodayStackParamList = {
  TodayHome: undefined;
  LogWeight: undefined;
};

export type DietStackParamList = {
  DietToday: undefined;
  DietPlans: undefined;
  DietPlanEditor: { planId?: string };
  FoodSearch: { mealId?: string; date: string };
};

export type WorkoutStackParamList = {
  WorkoutToday: undefined;
  WorkoutActive: { workoutId?: string };
  WorkoutPrograms: undefined;
  WorkoutProgramEditor: { programId?: string };
  WorkoutHistory: undefined;
  WorkoutSessionDetail: { sessionId: string };
};

export type ProgressStackParamList = {
  ProgressHome: undefined;
  WeightGraph: undefined;
  DietAdherenceGraph: undefined;
  TrainingVolumeGraph: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
};

