import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { healthKitService } from '../services/HealthKitService';
import { DEFAULT_SYNC_CONFIG } from '../types/syncPoints';
import HolobotSelector from '../components/HolobotSelector';
import WorkoutModal from '../components/WorkoutModal';
import SyncTrainingInfoModal from '../components/SyncTrainingInfoModal';
import { UserHolobot } from '../types/user';
import { getRank } from '../types/holobot';
import { useMissionsStore } from '../stores/missionsStore';
import { v4 as uuid } from 'uuid';

interface HealthSummary {
  todaySteps: number;
  weeklySteps: any[];
  syncPoints: number;
  isHealthKitAvailable: boolean;
}

interface WorkoutRewards {
  syncPoints: number;
  exp: number;
  attributeBoosts: number;
  steps: number;
  time: number;
  holos: number;
  calories: number;
}

const FitnessScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { stats, calculateStats, addSyncTrainingEntry, canClaimWeeklyReward, canClaimStreakReward } = useSyncPointsStore();
  const { updateMissionProgress } = useMissionsStore();
  
  // Temporary bypass for HealthKit requirement (for development/preview)
  const BYPASS_HEALTHKIT = true; // Set to false for production
  
  // State management
  const [selectedHolobot, setSelectedHolobot] = useState<string | null>(null);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [healthSummary, setHealthSummary] = useState<HealthSummary>({
    todaySteps: 0,
    weeklySteps: [],
    syncPoints: 0,
    isHealthKitAvailable: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailySteps, setDailySteps] = useState(0);
  const [lastResetDate, setLastResetDate] = useState<string>('');
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  // Set initial selected holobot from user's holobots
  useEffect(() => {
    if (user?.holobots && user.holobots.length > 0 && !selectedHolobot) {
      setSelectedHolobot(user.holobots[0].name);
    }
  }, [user, selectedHolobot]);

  // Initialize HealthKit on component mount
  useEffect(() => {
    initializeHealthKit();
  }, []);

  // Calculate stats when component mounts
  useEffect(() => {
    calculateStats();
  }, []);

  // Daily reset check
  useEffect(() => {
    const checkDailyReset = () => {
      const today = new Date().toDateString();
      if (lastResetDate !== today) {
        setDailySteps(0);
        setLastResetDate(today);
        console.log('Daily steps reset for new day');
      }
    };

    checkDailyReset();
    
    // Check every minute for midnight reset
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, [lastResetDate]);

  const initializeHealthKit = async () => {
    try {
      setLoading(true);
      const initialized = await healthKitService.initialize();
      
      if (initialized) {
        // Update HealthKit connection mission
        await updateMissionProgress('connect_healthkit_s1', 1);
        await refreshHealthData();
      } else {
        Alert.alert(
          'HealthKit Unavailable',
          'HealthKit is not available on this device or permissions were denied. You can still use manual tracking.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error initializing HealthKit:', error);
      Alert.alert('Error', 'Failed to initialize HealthKit');
    } finally {
      setLoading(false);
    }
  };

  const refreshHealthData = async () => {
    try {
      const summary = await healthKitService.getHealthSummary();
      setHealthSummary(summary);
      setDailySteps(summary.todaySteps);
      
      // Auto-sync if HealthKit is available
      if (summary.isHealthKitAvailable) {
        await healthKitService.autoSync();
        calculateStats(); // Refresh stats after sync
      }
    } catch (error) {
      console.error('Error refreshing health data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHealthData();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    if (!healthKitService.isReady()) {
      Alert.alert('HealthKit Not Ready', 'Please enable HealthKit permissions first.');
      return;
    }

    try {
      await healthKitService.autoSync();
      await refreshHealthData();
      Alert.alert('Success', 'Health data synced successfully!');
    } catch (error) {
      console.error('Error syncing health data:', error);
      Alert.alert('Error', 'Failed to sync health data');
    }
  };

  const startSyncTraining = () => {
    if (!selectedHolobot) {
      Alert.alert('No Holobot Selected', 'Please select a Holobot to train with');
      return;
    }

    if (!healthSummary.isHealthKitAvailable && !BYPASS_HEALTHKIT) {
      Alert.alert(
        'HealthKit Required', 
        'HealthKit permissions are required for Sync Training to track your workout accurately.'
      );
      return;
    }

    // Show warning if bypassing HealthKit
    if (BYPASS_HEALTHKIT && !healthSummary.isHealthKitAvailable) {
      Alert.alert(
        'Development Mode',
        'HealthKit is bypassed for preview. Step tracking will be simulated.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue Preview', onPress: () => setWorkoutModalVisible(true) }
        ]
      );
      return;
    }

    setWorkoutModalVisible(true);
  };

  const handleWorkoutComplete = async (rewards: WorkoutRewards) => {
    if (!user || !selectedHolobot) return;

    try {
      // Add sync training entry
      if (rewards.time > 0) {
        const minutes = Math.floor(rewards.time / 60);
        addSyncTrainingEntry(minutes);
      }

      // Update mission progress
      // First workout mission
      await updateMissionProgress('first_workout_s1', 1);
      
      // Workout streak mission (handled by backend)
      await updateMissionProgress('workout_streak_5_s1', stats.streak);
      
      // Max workouts mission
      const workoutsToday = getHolobotsUsedToday() + 1;
      const maxWorkouts = getMaxWorkoutsPerDay();
      if (workoutsToday === maxWorkouts) {
        await updateMissionProgress('max_workouts_3_s1', 1);
      }
      
      // Unique holobots mission
      await updateMissionProgress('unique_holobots_3_s1', 1);

      // Find the selected holobot
      const selectedHolobotData = user.holobots.find(
        h => h.name.toLowerCase() === selectedHolobot.toLowerCase()
      );

      if (selectedHolobotData) {
        // Update user with rewards and mark Holobot as used today
        const today = new Date().toISOString();
        const updatedHolobots = user.holobots.map(bot =>
          bot.name.toLowerCase() === selectedHolobot.toLowerCase()
            ? {
                ...bot,
                experience: bot.experience + rewards.exp,
                attributePoints: (bot.attributePoints || 0) + rewards.attributeBoosts,
                lastSyncWorkoutDate: today,
                syncWorkoutCountToday: 1
              }
            : bot
        );

        await updateUser({
          holobots: updatedHolobots,
        });

        // Create workout summary message
        let summaryMessage = `Great job! You earned:\n• ${rewards.syncPoints} Sync Points\n• ${rewards.exp} EXP\n• ${rewards.attributeBoosts} Attribute Points\n• ${rewards.steps} Steps in ${Math.floor(rewards.time / 60)} minutes`;
        
        if (rewards.calories > 0) {
          summaryMessage += `\n• ${rewards.calories} Calories burned`;
        }
        
        if (rewards.holos > 0) {
          summaryMessage += `\n• ${rewards.holos} Holos earned`;
        }

        Alert.alert('Workout Complete! 🎉', summaryMessage, [{ text: 'Awesome!' }]);
      }

      // Refresh health data
      await refreshHealthData();
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout progress');
    }
  };

  const calculateSyncPointsFromSteps = (steps: number): number => {
    if (steps < DEFAULT_SYNC_CONFIG.minimumStepsForReward) {
      return 0;
    }
    
    const baseSyncPoints = Math.floor(steps / DEFAULT_SYNC_CONFIG.stepsPerSyncPoint);
    const streakIndex = Math.min(stats.streak, DEFAULT_SYNC_CONFIG.bonusMultipliers.streak.length - 1);
    const streakMultiplier = stats.streak > 0 ? DEFAULT_SYNC_CONFIG.bonusMultipliers.streak[streakIndex] : 1;
    
    return Math.floor(baseSyncPoints * streakMultiplier);
  };

  const getDailyGoalProgress = (): number => {
    return Math.min((dailySteps / DEFAULT_SYNC_CONFIG.dailyStepGoal) * 100, 100);
  };

  const getSelectedHolobotData = (): UserHolobot | null => {
    if (!user?.holobots || !selectedHolobot) return null;
    return user.holobots.find(h => h.name.toLowerCase() === selectedHolobot.toLowerCase()) || null;
  };

  // Check if Holobot has been used for Sync Training today
  const isHolobotUsedToday = (holobot: UserHolobot): boolean => {
    if (!holobot.lastSyncWorkoutDate) return false;
    
    const lastWorkoutDate = new Date(holobot.lastSyncWorkoutDate);
    const today = new Date();
    
    return (
      lastWorkoutDate.toDateString() === today.toDateString() &&
      (holobot.syncWorkoutCountToday || 0) > 0
    );
  };

  // Add a helper to normalize player rank
  const normalizePlayerRank = (rank?: string): string => {
    if (!rank) return 'Common';
    if (rank.toLowerCase() === 'legend' || rank.toLowerCase() === 'legendary') return 'Legendary';
    return rank;
  };

  // Update getMaxWorkoutsPerDay to use normalized rank
  const getMaxWorkoutsPerDay = (): number => {
    const playerLimits: Record<string, number> = {
      "Common": 1,
      "Champion": 2,
      "Rare": 3,
      "Elite": 4,
      "Legendary": 5,
    };
    return playerLimits[normalizePlayerRank(user?.playerRank)] || 1;
  };

  // Get count of Holobots used today
  const getHolobotsUsedToday = (): number => {
    if (!user?.holobots) return 0;
    return user.holobots.filter(holobot => isHolobotUsedToday(holobot)).length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing HealthKit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedHolobotData = getSelectedHolobotData();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FITNESS SYNC</Text>
          <Text style={styles.subtitle}>Turn your steps into Sync Points</Text>
          {user && (
            <Text style={styles.welcomeText}>Welcome back, {user.username}!</Text>
          )}
        </View>

        {/* Daily Steps Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Steps</Text>
          <View style={styles.dailyStepsContainer}>
            <Text style={styles.stepsValue}>{dailySteps.toLocaleString()}</Text>
            <Text style={styles.stepsLabel}>Steps Today</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Daily Goal: {getDailyGoalProgress().toFixed(0)}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getDailyGoalProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressSubtext}>
                {DEFAULT_SYNC_CONFIG.dailyStepGoal.toLocaleString()} steps goal
              </Text>
            </View>

            <View style={styles.syncPointsFromSteps}>
              <Text style={styles.syncPointsLabel}>Sync Points from Steps:</Text>
              <Text style={styles.syncPointsValue}>
                {calculateSyncPointsFromSteps(dailySteps)} SP
              </Text>
            </View>
          </View>
        </View>

        {/* Holobot Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync Training</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: '#37C9FF', marginRight: 6 }}>
              Workouts per day: <Text>{getMaxWorkoutsPerDay()}</Text>
            </Text>
          </View>
          <HolobotSelector
            holobots={user?.holobots || []}
            selectedHolobot={selectedHolobot}
            onSelect={setSelectedHolobot}
            showWorkoutStatus={true}
          />

          {/* Selected Holobot Info */}
          {selectedHolobotData && (
            <View style={styles.selectedHolobotInfo}>
              <View style={styles.holobotStatsRow}>
                <View style={styles.holobotStat}>
                  <Text style={styles.holobotStatLabel}>LEVEL</Text>
                  <Text style={styles.holobotStatValue}>{selectedHolobotData.level}</Text>
                </View>
                <View style={styles.holobotStat}>
                  <Text style={styles.holobotStatLabel}>RANK</Text>
                  <Text style={styles.holobotStatValue}>
                    {selectedHolobotData.rank || getRank(selectedHolobotData.level)}
                  </Text>
                </View>
                <View style={styles.holobotStat}>
                  <Text style={styles.holobotStatLabel}>EXP</Text>
                  <Text style={styles.holobotStatValue}>
                    {selectedHolobotData.experience}/{selectedHolobotData.nextLevelExp}
                  </Text>
                </View>
              </View>

              {/* Available Attribute Points */}
              {selectedHolobotData.attributePoints && selectedHolobotData.attributePoints > 0 && (
                <View style={styles.attributePointsContainer}>
                  <Text style={styles.attributePointsText}>
                    💪 {selectedHolobotData.attributePoints} Attribute Points Available
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Apple Watch Tip */}
          <View style={styles.watchTipContainer}>
            <Text style={styles.watchTipText}>
              ⌚️ For best results on treadmills, start an Indoor Walk/Run workout on your Apple Watch.
            </Text>
          </View>

          {/* Start Sync Training Button */}
          <TouchableOpacity
            style={[
              styles.syncTrainingButton,
              (!selectedHolobot || (!healthSummary.isHealthKitAvailable && !BYPASS_HEALTHKIT)) && styles.syncTrainingButtonDisabled
            ]}
            onPress={startSyncTraining}
            disabled={!selectedHolobot || (!healthSummary.isHealthKitAvailable && !BYPASS_HEALTHKIT)}
          >
            <Text style={styles.syncTrainingButtonText}>
              Start Sync Training
            </Text>
          </TouchableOpacity>

          {/* Sync Training Info Modal */}
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => setInfoModalVisible(true)}
          >
            <Text style={styles.infoButtonText}>What is Sync Training?</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Progress and Rewards */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Progress & Rewards</Text>
          <View style={styles.weeklyStatsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Steps This Week</Text>
              <Text style={styles.statValue}>{healthSummary.weeklySteps.reduce((sum, entry) => sum + entry.value, 0).toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Sync Points Earned</Text>
              <Text style={styles.statValue}>{stats.weeklySyncPoints.toLocaleString()}</Text>
            </View>
          </View>
          
          <View style={styles.weeklyGoalContainer}>
            <Text style={styles.progressLabel}>
              Weekly Goal: {((healthSummary.weeklySteps.reduce((sum, entry) => sum + entry.value, 0) / DEFAULT_SYNC_CONFIG.weeklyStepGoal) * 100).toFixed(0)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(healthSummary.weeklySteps.reduce((sum, entry) => sum + entry.value, 0) / DEFAULT_SYNC_CONFIG.weeklyStepGoal) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              {DEFAULT_SYNC_CONFIG.weeklyStepGoal.toLocaleString()} steps goal
            </Text>
          </View>

          {canClaimWeeklyReward() && (
            <TouchableOpacity 
              style={styles.claimRewardButton} 
              onPress={() => Alert.alert('Claim Weekly Reward', 'Feature coming soon!')}
            >
              <Text style={styles.claimRewardButtonText}>CLAIM WEEKLY REWARD</Text>
            </TouchableOpacity>
          )}

          {!canClaimWeeklyReward() && stats.weeklySteps >= DEFAULT_SYNC_CONFIG.weeklyStepGoal && (
            <Text style={styles.rewardClaimedText}>Weekly reward claimed!</Text>
          )}

          {!canClaimWeeklyReward() && stats.weeklySteps < DEFAULT_SYNC_CONFIG.weeklyStepGoal && (
            <Text style={styles.rewardInfoText}>
              Reach {DEFAULT_SYNC_CONFIG.weeklyStepGoal.toLocaleString()} steps this week to earn a Premium Booster Pack Ticket!
            </Text>
          )}
        </View>

        {/* Streak Bonus */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Sync Streak Bonus</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Current Streak:</Text>
            <Text style={styles.streakValue}>{stats.streak} Days</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Longest Streak:</Text>
            <Text style={styles.streakValue}>{user?.rewardSystem?.trainingStreak?.longestStreak || 0} Days</Text>
          </View>

          {canClaimStreakReward() && (
            <TouchableOpacity 
              style={styles.claimRewardButton} 
              onPress={() => Alert.alert('Claim Streak Reward', 'Feature coming soon!')}
            >
              <Text style={styles.claimRewardButtonText}>CLAIM STREAK REWARD</Text>
            </TouchableOpacity>
          )}
          
          {!canClaimStreakReward() && stats.streak >= 7 && (
            <Text style={styles.rewardClaimedText}>7-Day Streak Reward claimed!</Text>
          )}

          {!canClaimStreakReward() && stats.streak < 7 && (
            <Text style={styles.rewardInfoText}>
              Complete 7 consecutive days of Sync Training to earn a Premium Booster Pack Ticket!
            </Text>
          )}
        </View>

        {/* HealthKit Connection Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HealthKit Connection</Text>
          <Text style={styles.healthKitStatusText}>
            Status: {healthSummary.isHealthKitAvailable ? 'Connected ✅' : 'Disconnected ❌'}
          </Text>
          {!healthSummary.isHealthKitAvailable && (
            <TouchableOpacity style={styles.connectButton} onPress={initializeHealthKit}>
              <Text style={styles.connectButtonText}>Connect HealthKit</Text>
            </TouchableOpacity>
          )}
          {healthSummary.isHealthKitAvailable && (
            <TouchableOpacity style={styles.manualSyncButton} onPress={handleManualSync}>
              <Text style={styles.manualSyncButtonText}>Manual Sync Data</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Development Mode Section */}
        {BYPASS_HEALTHKIT && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Development Mode</Text>
            <Text style={styles.devModeText}>
              HealthKit bypass is active. Steps and workouts will be simulated.
            </Text>
          </View>
        )}

        <WorkoutModal
          visible={workoutModalVisible}
          onClose={() => setWorkoutModalVisible(false)}
          selectedHolobot={selectedHolobotData}
          onWorkoutComplete={handleWorkoutComplete}
          bypassHealthKit={BYPASS_HEALTHKIT}
          userHolobots={user?.holobots || []}
          playerRank={user?.playerRank || 'Common'}
        />

        <SyncTrainingInfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#37C9FF',
    shadowColor: '#37C9FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  dailyStepsContainer: {
    alignItems: 'center',
  },
  stepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ade80',
  },
  stepsLabel: {
    fontSize: 16,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ade80',
    borderRadius: 5,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  syncPointsFromSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  syncPointsLabel: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: 'bold',
  },
  syncPointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  selectedHolobotInfo: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  holobotStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  holobotStat: {
    alignItems: 'center',
  },
  holobotStatLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  holobotStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  attributePointsContainer: {
    backgroundColor: '#ff6b35',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  attributePointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchTipContainer: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#37C9FF',
  },
  watchTipText: {
    fontSize: 13,
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  syncTrainingButton: {
    backgroundColor: '#37C9FF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  syncTrainingButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.7,
  },
  syncTrainingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 14,
    color: '#37C9FF',
    textDecorationLine: 'underline',
  },
  weeklyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  weeklyGoalContainer: {
    width: '100%',
    marginBottom: 15,
  },
  claimRewardButton: {
    backgroundColor: '#ff6b35',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  claimRewardButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardClaimedText: {
    fontSize: 14,
    color: '#4ade80',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
  rewardInfoText: {
    fontSize: 13,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 10,
  },
  streakInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  streakValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  healthKitStatusText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  connectButton: {
    backgroundColor: '#4ade80',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  manualSyncButton: {
    backgroundColor: '#37C9FF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  manualSyncButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  devModeText: {
    fontSize: 14,
    color: '#ff6b35',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default FitnessScreen; 