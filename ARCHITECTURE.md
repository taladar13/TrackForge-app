# TrackForge Architecture Overview

## High-Level Architecture

TrackForge is built with a **feature-based architecture** that promotes separation of concerns and scalability. The app uses:

- **React Native + Expo** for cross-platform mobile development
- **TypeScript** for type safety throughout
- **React Navigation** for navigation (bottom tabs + nested stacks)
- **TanStack Query (React Query)** for server state management
- **Zustand** for lightweight global state
- **React Hook Form** for form validation and management

## Navigation Structure

```
RootNavigator (Authentication-based routing)
├── Auth Stack (when not authenticated)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── OnboardingScreen
│
└── Main Tabs (when authenticated)
    ├── Today Stack
    │   ├── TodayHome
    │   └── LogWeight
    ├── Diet Stack
    │   ├── DietToday
    │   ├── DietPlans
    │   ├── DietPlanEditor
    │   └── FoodSearch
    ├── Workout Stack
    │   ├── WorkoutToday
    │   ├── WorkoutActive
    │   ├── WorkoutPrograms
    │   ├── WorkoutProgramEditor
    │   ├── WorkoutHistory
    │   └── WorkoutSessionDetail
    ├── Progress Stack
    │   ├── ProgressHome
    │   ├── WeightGraph
    │   ├── DietAdherenceGraph
    │   └── TrainingVolumeGraph
    └── Profile Stack
        ├── ProfileHome
        └── EditProfile
```

## State Management Strategy

### Server State (React Query)
- All API data is managed via React Query hooks
- Automatic caching, refetching, and background updates
- Optimistic updates for better UX
- Query invalidation for data consistency

### Local/UI State (Zustand)
- **Auth Store**: User authentication state
- **Offline Store**: Network status and sync queue state

### Component State (React useState)
- Form inputs
- UI interactions (modals, toggles, etc.)
- Temporary selections

## API Layer Architecture

```
src/api/
├── client.ts          # Axios instance with interceptors
├── endpoints/
│   ├── auth.ts       # Authentication endpoints
│   ├── diet.ts       # Diet-related endpoints
│   ├── workout.ts    # Workout endpoints
│   └── progress.ts   # Progress/analytics endpoints
└── hooks/
    ├── useAuth.ts    # Auth React Query hooks
    ├── useDiet.ts    # Diet hooks
    ├── useWorkout.ts # Workout hooks
    └── useProgress.ts # Progress hooks
```

**Design Pattern:**
- Endpoints are typed functions that call the API client
- React Query hooks wrap endpoints with caching logic
- All API responses are typed via TypeScript interfaces

## Offline-First Workout Logging

### Architecture
1. **Offline Queue Service** (`src/services/offlineQueue.ts`)
   - Manages queue of unsynced workout sessions
   - Stores items in AsyncStorage
   - Handles retry logic (max 3 attempts)

2. **Network Monitoring** (`App.tsx`)
   - Monitors network status via NetInfo
   - Automatically syncs queue when online
   - Periodic sync check (every 30 seconds)

3. **UI Indicators** (`useOfflineStore`)
   - Shows offline status banner
   - Displays pending sync count
   - Visual feedback during sync

### Flow
```
User logs workout offline
  → Store in AsyncStorage queue
  → Show "Offline - will sync" indicator
  → Network restored
  → Automatic sync triggered
  → Remove from queue on success
  → Update UI with sync status
```

## Data Types & Models

All entities are defined in `src/types/index.ts`:

- **User & Profile**: Authentication and user data
- **Diet**: Plans, meals, items, food database
- **Workout**: Programs, exercises, sessions, sets
- **Progress**: Body metrics, adherence data, volume data

## Theme System

Centralized design system in `src/theme/`:

- **Colors**: Primary, secondary, status, neutrals
- **Typography**: Font sizes, weights, line heights, text styles
- **Spacing**: Consistent spacing scale
- **Components**: Reusable UI primitives

## Feature Modules

Each feature is self-contained:

```
src/features/{feature}/
├── screens/          # Feature screens
├── components/       # Feature-specific components (optional)
└── hooks/           # Feature-specific hooks (optional)
```

Current features:
- `today/`: Daily overview
- `diet/`: Diet tracking and plans
- `workout/`: Workout logging and programs
- `progress/`: Analytics and graphs
- `profile/`: User profile and auth

## Reusable Components

Located in `src/components/`:

- **Card**: Container with shadow/border
- **Button**: Multiple variants (primary, secondary, outline, text)
- **Input**: Text input with label and error handling
- **ProgressRing**: Circular progress indicator
- **LoadingSpinner**: Loading state indicator
- **ErrorView**: Error display with retry

## Utilities

- **calculations.ts**: Business logic (1RM, volume, adherence)
- **storage.ts**: AsyncStorage wrapper for auth and queue

## Key Design Decisions

1. **Feature-based folders**: Easy to navigate and scale
2. **Typed API layer**: Type safety from API to UI
3. **Offline-first workouts**: Critical feature works without connectivity
4. **React Query for server state**: Reduces boilerplate, handles caching
5. **Zustand for minimal global state**: Lightweight, simple API
6. **React Hook Form**: Reduces form code, built-in validation

## Extensibility Points

1. **OCR Integration**: Placeholder in DietPlanEditorScreen
2. **More chart types**: Victory Native supports many chart types
3. **Push notifications**: Expo notifications can be added
4. **Social features**: Can add sharing, friends, etc.
5. **Export/Import**: Can add data export functionality

## Performance Considerations

- **FlatLists**: Used for long lists (history, plans, etc.)
- **React Query caching**: Reduces unnecessary API calls
- **Optimistic updates**: Immediate UI feedback
- **Lazy loading**: Charts only load when screen is viewed
- **Image optimization**: When images are added, use Expo Image

## Testing Strategy (Future)

Recommended test structure:
- **Unit tests**: Utilities, calculations
- **Integration tests**: API hooks, offline queue
- **E2E tests**: Critical user flows (login, log workout, track diet)

## Security Notes

Current implementation uses AsyncStorage for tokens. For production:
- Consider using Expo SecureStore for sensitive data
- Implement token refresh logic
- Add request signing/encryption if needed
- Validate all user inputs on backend

