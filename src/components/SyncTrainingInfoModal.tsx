import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface SyncTrainingInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const SyncTrainingInfoModal: React.FC<SyncTrainingInfoModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Quest Information</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Sync Training Rules */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚡</Text>
                <Text style={styles.sectionTitle}>Sync Training Rules</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  • Each Holobot can train ONCE per day{'\n'}
                  • Player Rank determines daily workout limit{'\n'}
                  • 15-minute sessions with real-time tracking{'\n'}
                  • Real step counting via HealthKit integration
                </Text>
              </View>
            </View>

            {/* Reward System */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🎁</Text>
                <Text style={styles.sectionTitle}>Quest Rewards</Text>
              </View>
              <View style={styles.rewardGrid}>
                <View style={styles.rewardCategory}>
                  <Text style={styles.rewardCategoryTitle}>Sync Points</Text>
                  <Text style={styles.rewardDetail}>• Base reward: Steps ÷ 50</Text>
                  <Text style={styles.rewardDetail}>• Holobot Rank: 1.0×-2.0× multiplier</Text>
                  <Text style={styles.rewardDetail}>• Legendary Holobots: 2.0× SP</Text>
                </View>
                
                <View style={styles.rewardCategory}>
                  <Text style={styles.rewardCategoryTitle}>Holos Tokens</Text>
                  <Text style={styles.rewardDetail}>• Elite Players: Calories × 0.25</Text>
                  <Text style={styles.rewardDetail}>• Legendary Players: Calories × 0.5</Text>
                  <Text style={styles.rewardDetail}>• Common-Rare: No Holos</Text>
                </View>
              </View>
            </View>

            {/* Rank Benefits */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>👑</Text>
                <Text style={styles.sectionTitle}>Rank Benefits</Text>
              </View>
              <View style={styles.rankTable}>
                <View style={styles.rankRow}>
                  <Text style={styles.rankName}>Common</Text>
                  <Text style={styles.rankBenefit}>1 workout/day</Text>
                  <Text style={styles.rankMultiplier}>No Holos</Text>
                </View>
                <View style={styles.rankRow}>
                  <Text style={styles.rankName}>Champion</Text>
                  <Text style={styles.rankBenefit}>2 workouts/day</Text>
                  <Text style={styles.rankMultiplier}>No Holos</Text>
                </View>
                <View style={styles.rankRow}>
                  <Text style={styles.rankName}>Rare</Text>
                  <Text style={styles.rankBenefit}>3 workouts/day</Text>
                  <Text style={styles.rankMultiplier}>No Holos</Text>
                </View>
                <View style={styles.rankRow}>
                  <Text style={styles.rankName}>Elite</Text>
                  <Text style={styles.rankBenefit}>4 workouts/day</Text>
                  <Text style={styles.rankMultiplier}>×0.25 Holos</Text>
                </View>
                <View style={styles.rankRow}>
                  <Text style={styles.rankName}>Legendary</Text>
                  <Text style={styles.rankBenefit}>5 workouts/day</Text>
                  <Text style={styles.rankMultiplier}>×0.5 Holos</Text>
                </View>
              </View>
            </View>

            {/* Strategy Tips */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💡</Text>
                <Text style={styles.sectionTitle}>Strategy Tips</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  • Use highest rank Holobots for max SP{'\n'}
                  • Save Legendary Holobots for best sessions{'\n'}
                  • Upgrade Player Rank for more daily workouts{'\n'}
                  • Elite/Legendary players earn valuable Holos{'\n'}
                  • Plan your daily Holobot rotation strategically
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#37C9FF',
    maxWidth: 400,
    maxHeight: '80%',
    width: '90%',
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37C9FF',
  },
  infoCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  rewardGrid: {
    gap: 12,
  },
  rewardCategory: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  rewardCategoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 8,
  },
  rewardDetail: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  rankTable: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rankName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  rankBenefit: {
    fontSize: 11,
    color: '#ccc',
    flex: 1,
    textAlign: 'center',
  },
  rankMultiplier: {
    fontSize: 11,
    color: '#37C9FF',
    flex: 1,
    textAlign: 'right',
  },
});

export default SyncTrainingInfoModal; 