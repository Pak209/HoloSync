import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { DEFAULT_SYNC_CONFIG } from '../types/syncPoints';

export interface HealthKitOptions {
  permissions: {
    read: HealthKitPermissions['permissions']['read'];
    write: HealthKitPermissions['permissions']['write'];
  };
}

export interface StepData {
  value: number;
  date: string;
  source: string;
}

export interface WorkoutData {
  type: string;
  duration: number; // in minutes
  calories?: number;
  distance?: number;
  date: string;
}

class HealthKitService {
  private isInitialized = false;
  private readonly permissions: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        AppleHealthKit.Constants.Permissions.AppleExerciseTime,
        AppleHealthKit.Constants.Permissions.Workout,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      ],
      write: [],
    },
  };

  /**
   * Initialize HealthKit with required permissions
   */
  async initialize(): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(this.permissions, (error: string) => {
          if (error) {
            console.error('Error initializing HealthKit:', error);
            this.isInitialized = false;
            resolve(false);
            return;
          }
          
          this.isInitialized = true;
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error in HealthKit initialization:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if HealthKit is initialized and permissions are granted
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get step count for a specific date
   */
  async getStepsForDate(date: Date): Promise<number> {
    if (!this.isInitialized) {
      console.warn('HealthKit not initialized. Call initialize() first.');
      return 0;
    }

    try {
      return new Promise((resolve) => {
        const options = {
          date: date.toISOString(),
          includeManuallyAdded: false,
        };

        AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
          if (err) {
            console.error('Error fetching steps:', err);
            resolve(0);
          } else {
            // Get workouts for the same date to verify step count
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const workoutOptions = {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              type: AppleHealthKit.Constants.Activities.Walking,
            };

            AppleHealthKit.getSamples(workoutOptions, (workoutErr: string, workouts: any[]) => {
              if (workoutErr || !workouts.length) {
                resolve(0);
              } else {
                // Only count steps if there are active workouts
                resolve(Math.round(results.value || 0));
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('Error fetching steps:', error);
      return 0;
    }
  }

  /**
   * Get step count for today
   */
  async getTodaysSteps(): Promise<number> {
    return this.getStepsForDate(new Date());
  }

  /**
   * Get step counts for the last 7 days
   */
  async getWeeklySteps(): Promise<StepData[]> {
    if (!this.isInitialized) {
      console.warn('HealthKit not initialized. Call initialize() first.');
      return [];
    }

    const results: StepData[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      try {
        const steps = await this.getStepsForDate(date);
        results.push({
          value: steps,
          date: date.toISOString().split('T')[0],
          source: 'HealthKit',
        });
      } catch (error) {
        console.error(`Error fetching steps for ${date.toDateString()}:`, error);
        results.push({
          value: 0,
          date: date.toISOString().split('T')[0],
          source: 'HealthKit',
        });
      }
    }

    return results;
  }

  /**
   * Get active energy burned (calories) for a specific time range
   */
  async getActiveEnergyBurned(startDate: Date, endDate: Date): Promise<number> {
    if (!this.isInitialized) {
      console.warn('HealthKit not initialized');
      return 0;
    }

    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: any) => {
          if (error) {
            console.error('Error getting active energy:', error);
            resolve(0);
            return;
          }
          resolve(Math.round(results.value || 0));
        });
      });
    } catch (error) {
      console.error('Error in getActiveEnergyBurned:', error);
      return 0;
    }
  }

  /**
   * Get workout data for a specific date
   */
  async getWorkoutsForDate(date: Date): Promise<WorkoutData[]> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized. Call initialize() first.');
    }

    try {
      return new Promise((resolve) => {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const options: HealthInputOptions = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };

        AppleHealthKit.getSamples(options, (error: string, results: any[]) => {
          if (error) {
            console.error('Error fetching workouts for date:', error);
            resolve([]);
          } else {
            const workouts = results
              .filter(sample => sample.activityType)
              .map((workout: any) => ({
                type: workout.activityType || 'Unknown',
                duration: Math.round((workout.duration || 0) / 60), // Convert seconds to minutes
                calories: workout.totalEnergyBurned || undefined,
                distance: workout.totalDistance || undefined,
                date: workout.startDate,
              }));
            resolve(workouts);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching workouts for date:', error);
      return [];
    }
  }

  /**
   * Convert steps to Sync Points using the same logic as the web app
   */
  calculateSyncPointsFromSteps(steps: number, streak: number = 0): number {
    if (steps < DEFAULT_SYNC_CONFIG.minimumStepsForReward) {
      return 0;
    }

    const baseSyncPoints = Math.floor(steps / DEFAULT_SYNC_CONFIG.stepsPerSyncPoint);
    const streakIndex = Math.min(streak, DEFAULT_SYNC_CONFIG.bonusMultipliers.streak.length - 1);
    const streakMultiplier = streak > 0 ? DEFAULT_SYNC_CONFIG.bonusMultipliers.streak[streakIndex] : 1;
    
    return Math.floor(baseSyncPoints * streakMultiplier);
  }

  /**
   * Convert workout minutes to Sync Points
   */
  calculateSyncPointsFromWorkout(minutes: number, streak: number = 0): number {
    const baseSyncPoints = Math.floor(minutes * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute);
    const bonusSyncPoints = Math.floor(baseSyncPoints * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus);
    
    const streakIndex = Math.min(streak, DEFAULT_SYNC_CONFIG.bonusMultipliers.streak.length - 1);
    const streakMultiplier = streak > 0 ? DEFAULT_SYNC_CONFIG.bonusMultipliers.streak[streakIndex] : 1;
    
    return Math.floor(bonusSyncPoints * streakMultiplier);
  }

  /**
   * Sync today's steps with the Sync Points store
   */
  async syncTodaysSteps(): Promise<void> {
    try {
      const steps = await this.getTodaysSteps();
      
      if (steps > 0) {
        const { addStepsEntry } = useSyncPointsStore.getState();
        addStepsEntry(steps);
        console.log(`Synced ${steps} steps to Sync Points store`);
      }
    } catch (error) {
      console.error('Error syncing today\'s steps:', error);
    }
  }

  /**
   * Sync all workouts for today with the Sync Points store
   */
  async syncTodaysWorkouts(): Promise<void> {
    try {
      const workouts = await this.getWorkoutsForDate(new Date());
      
      for (const workout of workouts) {
        if (workout.duration > 0) {
          const { addSyncTrainingEntry } = useSyncPointsStore.getState();
          addSyncTrainingEntry(workout.duration);
          console.log(`Synced ${workout.duration} minute ${workout.type} workout to Sync Points store`);
        }
      }
    } catch (error) {
      console.error('Error syncing today\'s workouts:', error);
    }
  }

  /**
   * Auto-sync function to be called periodically
   */
  async autoSync(): Promise<void> {
    console.log('Starting HealthKit auto-sync...');
    
    try {
      await Promise.all([
        this.syncTodaysSteps(),
        this.syncTodaysWorkouts(),
      ]);
      
      console.log('HealthKit auto-sync completed successfully');
    } catch (error) {
      console.error('Error during HealthKit auto-sync:', error);
    }
  }

  /**
   * Get health summary for dashboard display
   */
  async getHealthSummary() {
    if (!this.isInitialized) {
      return {
        todaySteps: 0,
        weeklySteps: [],
        syncPoints: 0,
        isHealthKitAvailable: false,
      };
    }

    try {
      const [todaySteps, weeklySteps] = await Promise.all([
        this.getTodaysSteps(),
        this.getWeeklySteps(),
      ]);

      const { stats } = useSyncPointsStore.getState();
      
      return {
        todaySteps,
        weeklySteps,
        syncPoints: this.calculateSyncPointsFromSteps(todaySteps, stats.streak),
        isHealthKitAvailable: true,
      };
    } catch (error) {
      console.error('Error getting health summary:', error);
      return {
        todaySteps: 0,
        weeklySteps: [],
        syncPoints: 0,
        isHealthKitAvailable: false,
      };
    }
  }
}

// Create and export a singleton instance
export const healthKitService = new HealthKitService();

// Export the class for testing purposes
export { HealthKitService }; 