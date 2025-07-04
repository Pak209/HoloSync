import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { HOLOBOT_STATS, getHolobotByName } from '../types/holobot';
import { DEFAULT_SYNC_CONFIG } from '../types/syncPoints';
import { colors, spacing, borderRadius, typography } from '../styles/globalStyles';

interface HolobotOption {
  name: string;
  level: number;
  rank: string;
}

export const HolobotSyncTraining: React.FC = () => {
  const [minutes, setMinutes] = useState('');
  const [selectedHolobot, setSelectedHolobot] = useState<string | null>(null);
  const [showHolobotSelector, setShowHolobotSelector] = useState(false);
  
  const { user } = useAuth();
  const { addSyncTrainingEntry, getHolobotSyncBond } = useSyncPointsStore();
  
  const userHolobots: HolobotOption[] = user?.holobots?.map(h => ({
    name: h.name,
    level: h.level,
    rank: h.rank || 'Champion',
  })) || [];

  const handleSyncTraining = () => {
    const trainingMinutes = parseInt(minutes);
    
    if (!trainingMinutes || trainingMinutes < 1) {
      Alert.alert('Invalid Input', 'Please enter a valid number of training minutes (minimum 1).');
      return;
    }

    if (trainingMinutes > 300) {
      Alert.alert('Training Limit', 'Maximum training session is 300 minutes (5 hours).');
      return;
    }

    // Calculate Sync Points earned
    const baseSP = Math.floor(trainingMinutes * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute);
    const bonusSP = Math.floor(baseSP * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus);
    const totalSP = Math.floor(baseSP * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus);

    // Add the training entry
    addSyncTrainingEntry(trainingMinutes, selectedHolobot || undefined);
    
    // Show success message
    let message = `Training Complete!\n\nEarned: ${totalSP} Sync Points\n(${baseSP} base + ${bonusSP - baseSP} bonus)`;
    
    if (selectedHolobot) {
      const syncBond = getHolobotSyncBond(selectedHolobot);
      message += `\n\nSync Bond with ${selectedHolobot}:\nLevel ${syncBond.level} (${syncBond.progress}%)`;
    }

    Alert.alert('Sync Training Complete!', message);
    
    // Reset form
    setMinutes('');
    setSelectedHolobot(null);
  };

  const HolobotSelector: React.FC = () => (
    <View style={styles.holobotSelector}>
      <Text style={styles.selectorTitle}>Select Training Holobot</Text>
      <Text style={styles.selectorSubtitle}>
        Training with a specific Holobot builds your Sync Bond
      </Text>
      
      <TouchableOpacity
        style={[styles.holobotOption, !selectedHolobot && styles.selectedOption]}
        onPress={() => {
          setSelectedHolobot(null);
          setShowHolobotSelector(false);
        }}
      >
        <Text style={styles.optionText}>General Training (No Holobot)</Text>
        <Text style={styles.optionSubtext}>Earn SP without bond building</Text>
      </TouchableOpacity>

      {userHolobots.map((holobot, index) => {
        const syncBond = getHolobotSyncBond(holobot.name);
        const holobotStats = getHolobotByName(holobot.name);
        
        return (
          <TouchableOpacity
            key={`${holobot.name}-${index}`}
            style={[styles.holobotOption, selectedHolobot === holobot.name && styles.selectedOption]}
            onPress={() => {
              setSelectedHolobot(holobot.name);
              setShowHolobotSelector(false);
            }}
          >
            <View style={styles.holobotInfo}>
              <Text style={styles.holobotName}>{holobot.name}</Text>
              <Text style={styles.holobotDetails}>
                Level {holobot.level} • {holobot.rank}
              </Text>
              {holobotStats?.specialMove && (
                <Text style={styles.specialMove}>{holobotStats.specialMove}</Text>
              )}
            </View>
            <View style={styles.syncBondInfo}>
              <Text style={styles.bondLevel}>Bond Lv.{syncBond.level}</Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[styles.progressBar, { width: `${syncBond.progress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>{syncBond.progress}%</Text>
            </View>
          </TouchableOpacity>
        );
      })}
      
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setShowHolobotSelector(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  if (showHolobotSelector) {
    return <HolobotSelector />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏋️ Sync Training</Text>
        <Text style={styles.subtitle}>
          Focused training sessions earn extra Sync Points
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Training Minutes</Text>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={setMinutes}
            placeholder="Enter training minutes (1-300)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Training Holobot (Optional)</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowHolobotSelector(true)}
          >
            <Text style={styles.selectorButtonText}>
              {selectedHolobot || 'Select Holobot (Optional)'}
            </Text>
            <Text style={styles.selectorArrow}>›</Text>
          </TouchableOpacity>
          {selectedHolobot && (
            <View style={styles.selectedHolobotInfo}>
              <Text style={styles.selectedText}>
                Building Sync Bond with {selectedHolobot}
              </Text>
              <TouchableOpacity onPress={() => setSelectedHolobot(null)}>
                <Text style={styles.clearText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.rewardPreview}>
          <Text style={styles.previewTitle}>Training Rewards:</Text>
          {minutes && parseInt(minutes) > 0 && (
            <>
              <Text style={styles.previewText}>
                • Base SP: {Math.floor(parseInt(minutes) * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute)}
              </Text>
              <Text style={styles.previewText}>
                • Training Bonus: +{((DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus - 1) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.previewTotal}>
                Total SP: {Math.floor(parseInt(minutes) * DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute * DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus)}
              </Text>
              {selectedHolobot && (
                <Text style={styles.bondText}>
                  + Sync Bond progress with {selectedHolobot}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Sync Training Benefits:</Text>
          <Text style={styles.infoText}>
            • {DEFAULT_SYNC_CONFIG.syncTrainingPointsPerMinute} SP per minute
          </Text>
          <Text style={styles.infoText}>
            • +{((DEFAULT_SYNC_CONFIG.bonusMultipliers.syncTrainingBonus - 1) * 100).toFixed(0)}% bonus vs walking
          </Text>
          <Text style={styles.infoText}>
            • Build Sync Bonds with specific Holobots
          </Text>
          <Text style={styles.infoText}>
            • Higher bonds = ability & part bonuses
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.trainButton, (!minutes || parseInt(minutes) < 1) && styles.disabledButton]}
          onPress={handleSyncTraining}
          disabled={!minutes || parseInt(minutes) < 1}
        >
          <Text style={styles.trainButtonText}>Complete Sync Training</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#ff6b35',
    marginBottom: spacing.base,
  },
  header: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#ff6b35',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.base,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  selectorButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  selectorArrow: {
    fontSize: typography.lg,
    color: colors.textMuted,
  },
  selectedHolobotInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  selectedText: {
    fontSize: typography.sm,
    color: '#9b59b6',
    fontWeight: typography.semibold,
  },
  clearText: {
    fontSize: typography.sm,
    color: colors.error,
  },
  rewardPreview: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  previewTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: '#ff6b35',
    marginBottom: spacing.sm,
  },
  previewText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  previewTotal: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: '#ff6b35',
    marginTop: spacing.xs,
  },
  bondText: {
    fontSize: typography.sm,
    color: '#9b59b6',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  infoSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  trainButton: {
    backgroundColor: '#ff6b35',
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.textDisabled,
  },
  trainButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  // Holobot Selector Styles
  holobotSelector: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  selectorTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  selectorSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  holobotOption: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundTertiary,
  },
  optionText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionSubtext: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  holobotInfo: {
    flex: 1,
  },
  holobotName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  holobotDetails: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  specialMove: {
    fontSize: typography.sm,
    color: colors.primary,
    fontStyle: 'italic',
  },
  syncBondInfo: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  bondLevel: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#9b59b6',
    marginBottom: spacing.xs,
  },
  progressContainer: {
    width: 60,
    height: 4,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9b59b6',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  cancelButton: {
    backgroundColor: colors.error,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    marginTop: spacing.base,
  },
  cancelButtonText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
});

export default HolobotSyncTraining; 