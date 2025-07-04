import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { UserHolobot } from '../types/user';
import { healthKitService } from '../services/HealthKitService';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { DEFAULT_SYNC_CONFIG } from '../types/syncPoints';
import { getRank } from '../types/holobot';
import { getHolobotImage } from '../utils/holobotImages';
import { supabase } from '../integrations/supabase/client';

interface WorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  selectedHolobot: UserHolobot | null;
  onWorkoutComplete: (rewards: WorkoutRewards) => void;
  bypassHealthKit?: boolean;
  userHolobots: UserHolobot[];
  playerRank: string;
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

const WorkoutModal: React.FC<WorkoutModalProps> = ({
  visible,
  onClose,
  selectedHolobot,
  onWorkoutComplete,
  bypassHealthKit = false,
  userHolobots,
  playerRank,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [workoutSteps, setWorkoutSteps] = useState(0);
  const [stamina, setStamina] = useState(100);
  const [startSteps, setStartSteps] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepsRef = useRef<NodeJS.Timeout | null>(null);
  
  const { stats } = useSyncPointsStore();

  const normalizedPlayerRank = (playerRank: string) => {
    if (!playerRank) return 'Common';
    if (playerRank.toLowerCase() === 'legend' || playerRank.toLowerCase() === 'legendary') return 'Legendary';
    return playerRank;
  };

  // Get holobot rank multiplier for Sync Points
  const getHolobotRankMultiplier = (): number => {
    if (!selectedHolobot) return 1;
    
    const rankMultipliers: Record<string, number> = {
      "Common": 1.0,
      "Champion": 1.1,
      "Rare": 1.2,
      "Elite": 1.5,
      "Legendary": 2.0,
    };
    
    const rank = selectedHolobot.rank || getRank(selectedHolobot.level);
    return rankMultipliers[rank] || 1.0;
  };

  // Get player rank multiplier for Holos
  const getPlayerRankMultiplier = (): number => {
    const playerMultipliers: Record<string, number> = {
      "Common": 0,
      "Champion": 0,
      "Rare": 0,
      "Elite": 0.25,
      "Legendary": 0.5,
    };
    
    return playerMultipliers[normalizedPlayerRank(playerRank)] || 0;
  };

  // Get max workouts per day based on player rank
  const getMaxWorkoutsPerDay = (): number => {
    const playerLimits: Record<string, number> = {
      "Common": 1,
      "Champion": 2,
      "Rare": 3,
      "Elite": 4,
      "Legendary": 5,
    };
    
    return playerLimits[normalizedPlayerRank(playerRank)] || 1;
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

  // Get count of Holobots used today
  const getHolobotsUsedToday = (): number => {
    return userHolobots.filter(holobot => isHolobotUsedToday(holobot)).length;
  };

  // Check if user can start another workout
  const canStartWorkout = (): { canStart: boolean; reason?: string } => {
    if (!selectedHolobot) {
      return { canStart: false, reason: "No Holobot selected" };
    }

    if (isHolobotUsedToday(selectedHolobot)) {
      return { 
        canStart: false, 
        reason: "This Holobot has already completed its training today. Try syncing a different one!" 
      };
    }

    const usedToday = getHolobotsUsedToday();
    const maxWorkouts = getMaxWorkoutsPerDay();

    if (usedToday >= maxWorkouts) {
      return { 
        canStart: false, 
        reason: `Daily workout limit reached (${maxWorkouts}/${maxWorkouts}). Upgrade your Player Rank for more sessions!` 
      };
    }

    return { canStart: true };
  };

  // Calculate current workout rewards
  const calculateRewards = (): WorkoutRewards => {
    const syncPoints = Math.floor(workoutTime * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus);
    const expEarned = Math.floor(workoutSteps / 10); // 10 steps = 1 EXP
    const rankMultiplier = getHolobotRankMultiplier();
    
    // Calculate calories (simulated in bypass mode)
    const calories = bypassHealthKit ? Math.floor(workoutTime / 60) * 8 : 0; // ~8 calories per minute simulation
    
    // Calculate holos based on player rank (placeholder - will be calculated properly with real calories)
    const holos = 0; // Will be calculated after workout completion with real data
    
    return {
      syncPoints: Math.floor(syncPoints * rankMultiplier),
      exp: Math.floor(expEarned * rankMultiplier),
      attributeBoosts: Math.floor(workoutTime / 600), // 1 boost per 10 minutes
      steps: workoutSteps,
      time: workoutTime,
      holos: holos,
      calories: calories,
    };
  };

  // Calculate final rewards with real calorie data and rank-based system
  const calculateFinalRewards = async (): Promise<WorkoutRewards> => {
    let realCalories = 0;
    
    // Get real calorie data if not bypassing HealthKit
    if (!bypassHealthKit && workoutStartTime) {
      const endTime = new Date();
      try {
        realCalories = await healthKitService.getActiveEnergyBurned(workoutStartTime, endTime);
      } catch (error) {
        console.error('Error fetching calories:', error);
        realCalories = Math.floor(workoutTime / 60) * 8; // Fallback to simulation
      }
    } else {
      realCalories = Math.floor(workoutTime / 60) * 8; // Simulated calories
    }
    
    // Calculate rank-based rewards
    const syncPoints = Math.floor(workoutTime * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus);
    const expEarned = Math.floor(workoutSteps / 10); // 10 steps = 1 EXP
    const rankMultiplier = getHolobotRankMultiplier();
    const playerMultiplier = getPlayerRankMultiplier();
    
    // Calculate holos based on calories and player rank
    const holos = Math.floor(realCalories * playerMultiplier);
    
    const rewards = {
      syncPoints: Math.floor(syncPoints * rankMultiplier),
      exp: Math.floor(expEarned * rankMultiplier),
      attributeBoosts: Math.floor(workoutTime / 600), // 1 boost per 10 minutes
      steps: workoutSteps,
      time: workoutTime,
      holos: holos,
      calories: realCalories,
    };

    // Save workout to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('workout_history').insert({
          user_id: user.id,
          holobot_name: selectedHolobot?.name,
          holobot_rank: selectedHolobot?.rank || getRank(selectedHolobot?.level || 1),
          player_rank: normalizedPlayerRank(playerRank),
          steps: rewards.steps,
          calories: rewards.calories,
          duration: rewards.time,
          sync_points: rewards.syncPoints,
          holos: rewards.holos,
          exp_earned: rewards.exp,
          attribute_boosts: rewards.attributeBoosts,
        });
      }
    } catch (error) {
      console.error('Error saving workout history:', error);
    }
    
    return rewards;
  };

  // Start workout tracking
  const startWorkout = async () => {
    // Validate workout eligibility
    const validation = canStartWorkout();
    if (!validation.canStart) {
      Alert.alert('Workout Blocked', validation.reason || 'Cannot start workout');
      return;
    }

    try {
      // Get current steps as baseline (or 0 if bypassing HealthKit)
      let currentSteps = 0;
      if (!bypassHealthKit) {
        currentSteps = await healthKitService.getTodaysSteps();
      }
      setStartSteps(currentSteps);
      setWorkoutSteps(0);
      setStamina(100);
      setWorkoutTime(0);
      setWorkoutStartTime(new Date());
      setIsTracking(true);
      
      // Start timers
      timerRef.current = setInterval(() => {
        setWorkoutTime(prev => prev + 1);
        
        // Decrease stamina over time (depletes in ~15 minutes)
        setStamina(prev => {
          const newStamina = Math.max(0, prev - (100 / 900)); // 900 seconds = 15 minutes
          if (newStamina <= 0) {
            stopWorkout();
          }
          return newStamina;
        });
      }, 1000);
      
      // Check steps every 5 seconds
      stepsRef.current = setInterval(async () => {
        try {
          if (bypassHealthKit) {
            // Simulate step counting in bypass mode (random 10-30 steps every 5 seconds)
            const simulatedSteps = Math.floor(Math.random() * 20) + 10;
            setWorkoutSteps(prev => prev + simulatedSteps);
          } else {
            const currentSteps = await healthKitService.getTodaysSteps();
            const stepsDiff = Math.max(0, currentSteps - startSteps);
            setWorkoutSteps(stepsDiff);
          }
        } catch (error) {
          console.error('Error fetching steps during workout:', error);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Error', 'Failed to start workout tracking');
    }
  };

  // Stop workout tracking
  const stopWorkout = async () => {
    setIsTracking(false);
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (stepsRef.current) {
      clearInterval(stepsRef.current);
      stepsRef.current = null;
    }
    
    // Calculate final rewards with real calorie data
    const finalRewards = await calculateFinalRewards();
    
    // Complete workout if there was meaningful activity
    if (workoutTime > 60 || workoutSteps > 100) { // At least 1 minute or 100 steps
      onWorkoutComplete(finalRewards);
    }
    
    // Reset state
    setWorkoutTime(0);
    setWorkoutSteps(0);
    setStamina(100);
    setWorkoutStartTime(null);
    onClose();
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepsRef.current) clearInterval(stepsRef.current);
    };
  }, []);

  const currentRewards = calculateRewards();

  const handleWorkoutComplete = async () => {
    try {
      const rewards = await calculateFinalRewards();
      
      // Save workout to Supabase
      const { error } = await supabase.from('workout_history').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        holobot_name: selectedHolobot?.name || '',
        holobot_rank: selectedHolobot?.rank || getRank(selectedHolobot?.level || 1),
        player_rank: normalizedPlayerRank(playerRank),
        steps: rewards.steps,
        calories: rewards.calories,
        duration: rewards.time,
        sync_points: rewards.syncPoints,
        holos: rewards.holos,
        exp_earned: rewards.exp,
        attribute_boosts: rewards.attributeBoosts,
      });

      if (error) {
        console.error('Error saving workout:', error);
      }

      // Show completion modal with rewards
      Alert.alert(
        'Workout Complete! 🎉',
        `Great job! You earned:\n• ${rewards.syncPoints} Sync Points\n• ${rewards.exp} EXP\n• ${rewards.attributeBoosts} Attribute Points\n• ${rewards.steps} Steps in ${Math.floor(rewards.time / 60)} minutes\n• ${rewards.calories} Calories burned\n• ${rewards.holos} Holos earned`,
        [{ text: 'Awesome!', onPress: () => onWorkoutComplete(rewards) }]
      );
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to complete workout');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={stopWorkout}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={stopWorkout}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SYNC TRAINING</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Holobot Display */}
        {selectedHolobot && (
          <View style={styles.holobotSection}>
            <View style={styles.holobotContainer}>
              <Image
                source={getHolobotImage(selectedHolobot?.name || 'ace')}
                style={styles.holobotImage}
                resizeMode="contain"
              />
              <View style={[styles.energyRing, isTracking && styles.energyRingActive]} />
            </View>
            
            <View style={styles.holobotInfo}>
              <Text style={styles.holobotName}>{selectedHolobot.name}</Text>
              <Text style={styles.holobotLevel}>
                LVL {selectedHolobot.level} • EXP {selectedHolobot.experience}/{selectedHolobot.nextLevelExp}
              </Text>
            </View>
          </View>
        )}

        {/* Workout Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👟</Text>
            <Text style={styles.statLabel}>STEPS</Text>
            <Text style={styles.statValue}>{workoutSteps}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statLabel}>WORKOUT</Text>
            <Text style={styles.statValue}>{formatTime(workoutTime)}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>CALORIES{'\n'}BURNED</Text>
            <Text style={styles.statValue}>{calculateRewards().calories}</Text>
          </View>
        </View>

        {/* Stamina Bar */}
        <View style={styles.staminaContainer}>
          <Text style={styles.staminaLabel}>STAMINA</Text>
          <View style={styles.staminaBar}>
            <View 
              style={[
                styles.staminaFill,
                { width: `${stamina}%` },
                stamina < 30 && styles.staminaLow
              ]} 
            />
          </View>
          <Text style={styles.staminaValue}>{Math.round(stamina)}%</Text>
        </View>

        {/* Workout Rewards */}
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsTitle}>WORKOUT REWARDS</Text>
          <View style={styles.rewardsGrid}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>⚡</Text>
              <Text style={styles.rewardLabel}>SP</Text>
              <Text style={styles.rewardValue}>{calculateRewards().syncPoints}</Text>
            </View>
            
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>💎</Text>
              <Text style={styles.rewardLabel}>HOLOS</Text>
              <Text style={styles.rewardValue}>{calculateRewards().holos}</Text>
            </View>
          </View>
        </View>

        {/* Rank Bonuses */}
        <View style={styles.rankBonusesContainer}>
          {/* Holobot Rank Bonus */}
          {selectedHolobot && (
            <View style={styles.rankBonusCard}>
              <Text style={styles.rankBonusCardLabel}>HOLOBOT RANK</Text>
              <Text style={styles.rankBonusCardValue}>
                {selectedHolobot.rank || getRank(selectedHolobot.level)}
              </Text>
              <Text style={styles.rankBonusMultiplier}>SP ×{getHolobotRankMultiplier()}</Text>
            </View>
          )}

          {/* Player Rank Bonus */}
          <View style={styles.rankBonusCard}>
            <Text style={styles.rankBonusCardLabel}>PLAYER RANK</Text>
            <Text style={styles.rankBonusCardValue}>{normalizedPlayerRank(playerRank)}</Text>
            <Text style={styles.rankBonusMultiplier}>
              Holos ×{getPlayerRankMultiplier()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isTracking ? styles.stopButton : styles.startButton,
              !canStartWorkout().canStart && !isTracking && styles.disabledButton
            ]}
            onPress={isTracking ? stopWorkout : startWorkout}
            disabled={!canStartWorkout().canStart && !isTracking}
          >
            <Text style={styles.actionButtonText}>
              {isTracking ? 'STOP' : 'START'}
            </Text>
          </TouchableOpacity>
        </View>

        {!canStartWorkout().canStart && !isTracking && (
          <Text style={styles.warningText}>{canStartWorkout().reason}</Text>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#37C9FF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  headerSpacer: {
    width: 40,
  },
  holobotSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  holobotContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  holobotImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    zIndex: 2,
  },
  energyRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: '#37C9FF',
    opacity: 0.3,
  },
  energyRingActive: {
    opacity: 1,
    shadowColor: '#37C9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  holobotInfo: {
    alignItems: 'center',
  },
  holobotName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  holobotLevel: {
    fontSize: 14,
    color: '#37C9FF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  staminaContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  staminaLabel: {
    fontSize: 12,
    color: '#666',
  },
  staminaBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  staminaFill: {
    height: '100%',
    backgroundColor: '#4ade80',
  },
  staminaLow: {
    backgroundColor: '#ff4757',
  },
  staminaValue: {
    fontSize: 12,
    color: '#37C9FF',
    fontWeight: 'bold',
  },
  rewardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  rewardsTitle: {
    fontSize: 14,
    color: '#37C9FF',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardItem: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  rewardLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  rankBonusesContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  rankBonusCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b35',
    padding: 12,
    alignItems: 'center',
  },
  rankBonusCardLabel: {
    fontSize: 10,
    color: '#ff6b35',
    marginBottom: 4,
  },
  rankBonusCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rankBonusMultiplier: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#37C9FF',
  },
  stopButton: {
    backgroundColor: '#ff4757',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  warningText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
});

export default WorkoutModal; 