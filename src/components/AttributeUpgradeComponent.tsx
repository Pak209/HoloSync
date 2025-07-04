import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { HOLOBOT_STATS, getHolobotByName, getRank } from '../types/holobot';
import { calculateAttributeUpgradeCost, DEFAULT_SYNC_CONFIG } from '../types/syncPoints';
import { colors, spacing, borderRadius, typography } from '../styles/globalStyles';

interface AttributeUpgradeProps {
  holobotName: string;
  onClose?: () => void;
}

interface AttributeInfo {
  key: 'hp' | 'attack' | 'defense' | 'speed' | 'special';
  name: string;
  icon: string;
  color: string;
  description: string;
}

const ATTRIBUTE_INFO: AttributeInfo[] = [
  {
    key: 'hp',
    name: 'HEALTH',
    icon: '❤️',
    color: '#e74c3c',
    description: 'Increases maximum health points in battles',
  },
  {
    key: 'attack',
    name: 'ATTACK',
    icon: '⚔️',
    color: '#e67e22',
    description: 'Increases damage dealt in battles',
  },
  {
    key: 'defense',
    name: 'DEFENSE',
    icon: '🛡️',
    color: '#3498db',
    description: 'Reduces damage taken in battles',
  },
  {
    key: 'speed',
    name: 'SPEED',
    icon: '💨',
    color: '#2ecc71',
    description: 'Affects turn order and dodge chance',
  },
  {
    key: 'special',
    name: 'SPECIAL',
    icon: '✨',
    color: '#9b59b6',
    description: 'Powers up special attacks and abilities',
  },
];

export const AttributeUpgradeComponent: React.FC<AttributeUpgradeProps> = ({ 
  holobotName, 
  onClose 
}) => {
  const { user } = useAuth();
  const {
    upgradeAttribute,
    getHolobotAttributeLevel,
    getAvailableSyncPoints,
    canAffordUpgrade,
    getHolobotSyncBond,
  } = useSyncPointsStore();

  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  
  const availableSP = getAvailableSyncPoints();
  const holobotStats = getHolobotByName(holobotName);
  const userHolobot = user?.holobots?.find(h => h.name.toLowerCase() === holobotName.toLowerCase());
  const syncBond = getHolobotSyncBond(holobotName);

  if (!holobotStats || !userHolobot) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Holobot not found</Text>
      </View>
    );
  }

  const handleUpgrade = (attribute: 'hp' | 'attack' | 'defense' | 'speed' | 'special') => {
    const currentLevel = getHolobotAttributeLevel(holobotName, attribute);
    const upgradeCost = calculateAttributeUpgradeCost(currentLevel);
    
    if (currentLevel >= DEFAULT_SYNC_CONFIG.maxAttributeLevel) {
      Alert.alert('Max Level Reached', `${attribute.toUpperCase()} is already at maximum level.`);
      return;
    }
    
    if (!canAffordUpgrade(upgradeCost)) {
      Alert.alert(
        'Insufficient Sync Points',
        `You need ${upgradeCost} SP to upgrade ${attribute.toUpperCase()}, but only have ${availableSP} SP available.`
      );
      return;
    }

    Alert.alert(
      'Confirm Upgrade',
      `Upgrade ${holobotName}'s ${attribute.toUpperCase()} to level ${currentLevel + 1}?\n\nCost: ${upgradeCost} SP`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => {
            const success = upgradeAttribute(holobotName, attribute);
            if (success) {
              Alert.alert(
                'Upgrade Complete!',
                `${holobotName}'s ${attribute.toUpperCase()} has been upgraded to level ${currentLevel + 1}!`
              );
            } else {
              Alert.alert('Error', 'Failed to upgrade attribute. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getTotalInvestment = (): number => {
    return ATTRIBUTE_INFO.reduce((total, attr) => {
      const level = getHolobotAttributeLevel(holobotName, attr.key);
      const investment = DEFAULT_SYNC_CONFIG.attributeUpgradeCosts
        .slice(0, level)
        .reduce((sum, cost) => sum + cost, 0);
      return total + investment;
    }, 0);
  };

  const getAttributeBonus = (attribute: 'hp' | 'attack' | 'defense' | 'speed' | 'special'): number => {
    const level = getHolobotAttributeLevel(holobotName, attribute);
    const baseStat = holobotStats[attribute === 'hp' ? 'maxHealth' : attribute] || 0;
    
    // Each level adds 10% of base stat
    return Math.floor(baseStat * 0.1 * level);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{holobotName} Attributes</Text>
            <Text style={styles.subtitle}>
              Level {userHolobot.level} • {getRank(userHolobot.level)}
            </Text>
          </View>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sync Bond Info */}
        <View style={styles.syncBondCard}>
          <Text style={styles.syncBondTitle}>Sync Bond Level {syncBond.level}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${syncBond.progress}%` }]} />
          </View>
          <View style={styles.bondBonuses}>
            <Text style={styles.bondBonus}>Ability Boost: +{syncBond.abilityBoost}%</Text>
            <Text style={styles.bondBonus}>Part Compatibility: +{syncBond.partCompatibility}%</Text>
          </View>
        </View>

        {/* Available SP */}
        <View style={styles.spContainer}>
          <Text style={styles.spLabel}>Available Sync Points:</Text>
          <Text style={styles.spValue}>{availableSP}</Text>
          <Text style={styles.investmentText}>
            Total Invested: {getTotalInvestment()} SP
          </Text>
        </View>

        {/* Attributes */}
        <View style={styles.attributesContainer}>
          {ATTRIBUTE_INFO.map((attr) => {
            const currentLevel = getHolobotAttributeLevel(holobotName, attr.key);
            const upgradeCost = calculateAttributeUpgradeCost(currentLevel);
            const canUpgrade = canAffordUpgrade(upgradeCost) && currentLevel < DEFAULT_SYNC_CONFIG.maxAttributeLevel;
            const isMaxed = currentLevel >= DEFAULT_SYNC_CONFIG.maxAttributeLevel;
            const attributeBonus = getAttributeBonus(attr.key);
            const baseStat = holobotStats[attr.key === 'hp' ? 'maxHealth' : attr.key] || 0;

            return (
              <View key={attr.key} style={styles.attributeCard}>
                <View style={styles.attributeHeader}>
                  <View style={styles.attributeInfo}>
                    <Text style={styles.attributeIcon}>{attr.icon}</Text>
                    <View>
                      <Text style={[styles.attributeName, { color: attr.color }]}>
                        {attr.name}
                      </Text>
                      <Text style={styles.attributeDesc}>{attr.description}</Text>
                    </View>
                  </View>
                  <View style={styles.attributeStats}>
                    <Text style={styles.attributeLevel}>Lv.{currentLevel}</Text>
                    <Text style={styles.attributeValue}>
                      {baseStat} {attributeBonus > 0 && `(+${attributeBonus})`}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.levelProgressContainer}>
                  <View style={styles.levelProgressBar}>
                    <View 
                      style={[
                        styles.levelProgressFill, 
                        { 
                          width: `${(currentLevel / DEFAULT_SYNC_CONFIG.maxAttributeLevel) * 100}%`,
                          backgroundColor: attr.color,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.levelProgressText}>
                    {currentLevel}/{DEFAULT_SYNC_CONFIG.maxAttributeLevel}
                  </Text>
                </View>

                {/* Upgrade Button */}
                {!isMaxed ? (
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      canUpgrade ? styles.upgradeButtonEnabled : styles.upgradeButtonDisabled
                    ]}
                    onPress={() => handleUpgrade(attr.key)}
                    disabled={!canUpgrade}
                  >
                    <Text style={styles.upgradeButtonText}>
                      {canUpgrade ? `UPGRADE (${upgradeCost} SP)` : `NEED ${upgradeCost} SP`}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.maxLevelBadge}>
                    <Text style={styles.maxLevelText}>MAX LEVEL</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Strategy Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Upgrade Strategy</Text>
          <Text style={styles.tipText}>
            • <Text style={styles.highlight}>Health</Text>: Great for survival in long battles
          </Text>
          <Text style={styles.tipText}>
            • <Text style={styles.highlight}>Attack</Text>: Core damage dealing stat
          </Text>
          <Text style={styles.tipText}>
            • <Text style={styles.highlight}>Defense</Text>: Reduces incoming damage
          </Text>
          <Text style={styles.tipText}>
            • <Text style={styles.highlight}>Speed</Text>: Affects turn order and dodging
          </Text>
          <Text style={styles.tipText}>
            • <Text style={styles.highlight}>Special</Text>: Powers up unique abilities
          </Text>
          <Text style={styles.tipText}>
            • Higher Sync Bond levels multiply all bonuses!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    backgroundColor: colors.error,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  syncBondCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  syncBondTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#9b59b6',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressContainer: {
    height: 8,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9b59b6',
    borderRadius: borderRadius.sm,
  },
  bondBonuses: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bondBonus: {
    fontSize: typography.sm,
    color: '#9b59b6',
    fontWeight: typography.semibold,
  },
  spContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  spLabel: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  spValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  investmentText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
  attributesContainer: {
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  attributeCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attributeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  attributeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attributeIcon: {
    fontSize: typography['2xl'],
    marginRight: spacing.sm,
  },
  attributeName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
  },
  attributeDesc: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  attributeStats: {
    alignItems: 'flex-end',
  },
  attributeLevel: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  attributeValue: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  levelProgressContainer: {
    marginBottom: spacing.sm,
  },
  levelProgressBar: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  levelProgressText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'right',
  },
  upgradeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    alignItems: 'center',
  },
  upgradeButtonEnabled: {
    backgroundColor: colors.primary,
  },
  upgradeButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  upgradeButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  maxLevelBadge: {
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    alignItems: 'center',
  },
  maxLevelText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  tipsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  highlight: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  errorText: {
    fontSize: typography.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default AttributeUpgradeComponent; 