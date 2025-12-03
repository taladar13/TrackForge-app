# TrackForge Mobile App

A health & fitness companion app for people on strict diet and workout plans, built with React Native + Expo and TypeScript.

## Features

- **Today Screen**: Overview of daily diet, workout, and weight tracking
- **Diet Management**: Daily meal tracking, diet plans, and macro adherence
- **Workout Logging**: Exercise tracking with offline support, volume calculations, and 1RM estimates
- **Progress Tracking**: Weight trends, diet adherence calendar, and training volume graphs
- **Profile Management**: User profile, authentication, and onboarding

## Tech Stack

- **React Native + Expo**: Mobile framework
- **TypeScript**: Type safety
- **React Navigation**: Bottom tabs + nested stack navigation
- **TanStack Query (React Query)**: Server state management
- **Zustand**: Local state management
- **React Hook Form**: Form handling
- **Victory Native**: Charts and graphs
- **AsyncStorage**: Local persistence
- **Axios**: HTTP client

## Architecture

The app follows a feature-based folder structure:

```
src/
├── api/           # API client, endpoints, and React Query hooks
├── components/    # Reusable UI components
├── features/      # Feature modules (today, diet, workout, progress, profile)
├── navigation/    # Navigation configuration
├── services/      # Business logic services (offline queue, etc.)
├── store/         # Global state (Zustand stores)
├── theme/         # Design system (colors, typography, spacing)
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## API Configuration

The app is configured to use `https://api.trackforge.example` as the base API URL. Update this in `src/api/client.ts` to point to your backend.

## Offline Support

Workout logging works offline:
- Workout sessions are stored locally when offline
- Automatic sync when connectivity is restored
- Queue management with retry logic

## Key Features Implementation

### Diet Tracking
- Daily meal plans with macro tracking
- Food search and ad-hoc logging
- Adherence percentage calculation

### Workout Logging
- Real-time set/rep/weight tracking
- Volume calculations
- 1RM estimates (Epley formula)
- Offline-first design

### Progress Analytics
- Weight trend graphs (7/30/90 day ranges)
- Diet adherence calendar view
- Training volume by week/muscle group

## Future Enhancements (Placeholders Included)

- OCR food recognition (placeholder button included)
- More detailed workout program editor
- Advanced progress analytics
- Social features
- Export/import functionality

## License

MIT

