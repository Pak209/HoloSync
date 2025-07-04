import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import MissionsSection from '../components/MissionsSection';

const normalizePlayerRank = (rank?: string): string => {
  if (!rank) return 'Common';
  if (rank.toLowerCase() === 'legend' || rank.toLowerCase() === 'legendary') return 'Legendary';
  return rank;
};

const getHolosMultiplier = (rank: string): string => {
  const norm = normalizePlayerRank(rank);
  if (norm === 'Legendary') return '×0.5';
  if (norm === 'Elite') return '×0.25';
  return 'None';
};

const getMaxWorkouts = (rank: string): string => {
  const norm = normalizePlayerRank(rank);
  const workouts: Record<string, number> = {
    "Common": 1,
    "Champion": 2,
    "Rare": 3,
    "Elite": 4,
    "Legendary": 5,
  };
  return `${workouts[norm] || 1}/day`;
};

const getRankDescription = (rank: string): string => {
  const norm = normalizePlayerRank(rank);
  const descriptions: Record<string, string> = {
    "Common": "Starting your fitness journey",
    "Champion": "Building momentum",
    "Rare": "Dedicated fitness enthusiast",
    "Elite": "Advanced trainer with Holos rewards",
    "Legendary": "Ultimate fitness master",
  };
  return descriptions[norm] || '';
};

const getNextRank = (rank: string): string => {
  const norm = normalizePlayerRank(rank);
  const nextRanks: Record<string, string> = {
    "Common": "Champion",
    "Champion": "Rare",
    "Rare": "Elite",
    "Elite": "Legendary",
    "Legendary": "MAX",
  };
  return nextRanks[norm] || "Unknown";
};

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { stats, entries } = useSyncPointsStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  // Progression bar logic (example: based on totalSyncPoints)
  const rankOrder = ['Common', 'Champion', 'Rare', 'Elite', 'Legendary'];
  const currentRank = normalizePlayerRank(user?.playerRank);
  const nextRank = getNextRank(currentRank);
  const currentRankIndex = rankOrder.indexOf(currentRank);
  const nextRankIndex = rankOrder.indexOf(nextRank);
  // Example thresholds (replace with real if available)
  const rankThresholds = [0, 500, 1500, 3000, 6000];
  const currentPoints = stats.totalSyncPoints || 0;
  const currentThreshold = rankThresholds[currentRankIndex] || 0;
  const nextThreshold = rankThresholds[nextRankIndex] || currentThreshold + 1000;
  const progress = Math.min(1, (currentPoints - currentThreshold) / (nextThreshold - currentThreshold));

  // Recent workouts (last 5 sync_training entries)
  const recentWorkouts = entries
    .filter(e => e.activityType === 'sync_training')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Player Rank Section */}
        <View style={styles.playerRankContainer}>
          <Text style={styles.sectionTitle}>Player Rank</Text>
          <View style={styles.playerRankCard}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>👑</Text>
            </View>
            <View style={styles.rankInfo}>
              <Text style={styles.currentRank}>{currentRank}</Text>
              {/* Progression bar under rank */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <Text style={styles.progressBarText}>
                  {nextRank !== 'MAX'
                    ? `Sync Points: ${currentPoints}/${nextThreshold} to ${nextRank}`
                    : 'Max Rank'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.rankBenefitsContainer}>
            <Text style={styles.benefitsTitle}>Daily Benefits</Text>
            <View style={styles.benefitsGrid}>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>🏃</Text>
                <Text style={styles.benefitValue}>{getMaxWorkouts(currentRank)}</Text>
                <Text style={styles.benefitLabel}>Max Workouts</Text>
              </View>
              <View style={styles.benefitCard}>
                <Text style={styles.benefitIcon}>💎</Text>
                <Text style={styles.benefitValue}>{getHolosMultiplier(currentRank)}</Text>
                <Text style={styles.benefitLabel}>Holos Multiplier</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Fitness Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Sync Points</Text>
            <Text style={styles.statValue}>{stats.availableSyncPoints}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Steps Tracked</Text>
            <Text style={styles.statValue}>{stats.totalSteps}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{stats.streak}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{user?.level || 1}</Text>
          </View>
        </View>

        {/* Recent Achievements: Show recent workouts */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {recentWorkouts.length === 0 ? (
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>No recent workouts yet.</Text>
            </View>
          ) : (
            recentWorkouts.map((w, i) => (
              <View key={w.id} style={styles.workoutRow}>
                <Text style={styles.workoutText}>
                  {w.syncTrainingMinutes ? `${w.syncTrainingMinutes} min` : ''} - {w.syncPoints} SP - {new Date(w.timestamp).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Missions Section */}
        <MissionsSection />

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>Sync with Web App</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#37C9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  holobotsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  achievementsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 16,
  },
  syncButton: {
    backgroundColor: '#37C9FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerRankContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  playerRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#37C9FF',
  },
  rankBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#37C9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankBadgeText: {
    fontSize: 24,
  },
  rankInfo: {
    flex: 1,
  },
  currentRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rankDescription: {
    fontSize: 14,
    color: '#666',
  },
  rankBenefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 12,
  },
  benefitsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  benefitIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  benefitValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 4,
  },
  benefitLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: 8,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#37C9FF',
  },
  progressBarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  workoutRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  workoutText: {
    fontSize: 14,
    color: '#fff',
  },
});

export default ProfileScreen; 