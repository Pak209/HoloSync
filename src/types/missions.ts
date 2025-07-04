export type MissionStatus = 'locked' | 'in_progress' | 'completed' | 'claimed';

export interface Mission {
  id: string;
  title: string;
  description: string;
  reward: {
    type: 'sp_boost' | 'sync_points' | 'holos';
    amount: number;
    duration?: number; // in days, for boosts
  };
  requirements: {
    type: 'connect_healthkit' | 'workout_count' | 'workout_streak' | 'max_workouts' | 'unique_holobots';
    target: number;
    progress: number;
  };
  season: number;
  status: MissionStatus;
  completedAt?: string;
  expiresAt?: string;
}

export interface MissionProgress {
  workoutCount: number;
  workoutStreak: number;
  maxWorkoutsDays: number;
  uniqueHolobots: string[];
  healthKitConnected: boolean;
}

export const SEASON_1_MISSIONS: Mission[] = [
  {
    id: 'connect_healthkit_s1',
    title: 'Connect HealthKit',
    description: 'Connect your Apple Health for a 20% Season 1 SP boost!',
    reward: {
      type: 'sp_boost',
      amount: 20, // 20% boost
      duration: 90, // 90 days
    },
    requirements: {
      type: 'connect_healthkit',
      target: 1,
      progress: 0,
    },
    season: 1,
    status: 'locked',
  },
  {
    id: 'first_workout_s1',
    title: 'First Sync',
    description: 'Complete your first Sync Training workout',
    reward: {
      type: 'sync_points',
      amount: 500,
    },
    requirements: {
      type: 'workout_count',
      target: 1,
      progress: 0,
    },
    season: 1,
    status: 'locked',
  },
  {
    id: 'workout_streak_5_s1',
    title: 'Sync Streak Master',
    description: 'Complete 5 days of Sync Training in a row',
    reward: {
      type: 'sp_boost',
      amount: 10,
      duration: 30,
    },
    requirements: {
      type: 'workout_streak',
      target: 5,
      progress: 0,
    },
    season: 1,
    status: 'locked',
  },
  {
    id: 'max_workouts_3_s1',
    title: 'Maximum Effort',
    description: 'Complete your maximum daily workouts 3 days in a row',
    reward: {
      type: 'holos',
      amount: 1000,
    },
    requirements: {
      type: 'max_workouts',
      target: 3,
      progress: 0,
    },
    season: 1,
    status: 'locked',
  },
  {
    id: 'unique_holobots_3_s1',
    title: 'Holobot Explorer',
    description: 'Train with 3 different Holobots',
    reward: {
      type: 'sync_points',
      amount: 750,
    },
    requirements: {
      type: 'unique_holobots',
      target: 3,
      progress: 0,
    },
    season: 1,
    status: 'locked',
  },
]; 