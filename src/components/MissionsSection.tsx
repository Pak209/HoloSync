import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Mission } from '../types/missions';
import { useMissionsStore } from '../stores/missionsStore';

const MissionCard: React.FC<{
  mission: Mission;
  onClaim: (missionId: string) => void;
}> = ({ mission, onClaim }) => {
  const progress = Math.min(
    (mission.requirements.progress / mission.requirements.target) * 100,
    100
  );

  const getRewardText = () => {
    switch (mission.reward.type) {
      case 'sp_boost':
        return `${mission.reward.amount}% SP Boost for ${mission.reward.duration} days`;
      case 'sync_points':
        return `${mission.reward.amount} Sync Points`;
      case 'holos':
        return `${mission.reward.amount} Holos`;
      default:
        return '';
    }
  };

  return (
    <View style={styles.missionCard}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionTitle}>{mission.title}</Text>
        {mission.status === 'completed' && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => onClaim(mission.id)}
          >
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.missionDescription}>{mission.description}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {mission.requirements.progress} / {mission.requirements.target}
        </Text>
      </View>

      <View style={styles.rewardContainer}>
        <Text style={styles.rewardText}>🎁 {getRewardText()}</Text>
      </View>

      {mission.status === 'claimed' && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedText}>✓ CLAIMED</Text>
        </View>
      )}
    </View>
  );
};

const MissionsSection: React.FC = () => {
  const {
    missions,
    loading,
    error,
    initializeMissions,
    claimMissionReward,
    getActiveMissions,
    getCompletedMissions,
  } = useMissionsStore();

  React.useEffect(() => {
    initializeMissions();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading missions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const activeMissions = getActiveMissions();
  const completedMissions = getCompletedMissions();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Season 1 Missions</Text>
      
      <ScrollView style={styles.missionsContainer}>
        {/* Active Missions */}
        {activeMissions.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Active Missions</Text>
            {activeMissions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={claimMissionReward}
              />
            ))}
          </>
        )}

        {/* Completed Missions */}
        {completedMissions.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Completed</Text>
            {completedMissions.map(mission => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={claimMissionReward}
              />
            ))}
          </>
        )}

        {missions.length === 0 && (
          <Text style={styles.noMissionsText}>
            No missions available at the moment.
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  missionsContainer: {
    flex: 1,
  },
  missionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  missionDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#37C9FF',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  rewardContainer: {
    backgroundColor: '#2a1a0a',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#ff6b35',
    textAlign: 'center',
  },
  claimButton: {
    backgroundColor: '#37C9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1a472a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
  noMissionsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});

export default MissionsSection; 