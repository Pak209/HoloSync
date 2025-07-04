import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import { HOLOBOT_STATS, getRank, getHolobotByName } from '../types/holobot';
import { calculateSyncBondLevel } from '../types/syncPoints';
import { colors, spacing, borderRadius, typography } from '../styles/globalStyles';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.base * 3) / 2;

interface HolobotCardProps {
  holobotName: string;
  level: number;
  onPress: () => void;
}

const HolobotCard: React.FC<HolobotCardProps> = ({ holobotName, level, onPress }) => {
  const { getHolobotSyncBond, getHolobotAttributeLevel } = useSyncPointsStore();
  
  const holobotStats = getHolobotByName(holobotName);
  const syncBond = getHolobotSyncBond(holobotName);
  const rank = getRank(level);
  
  // Calculate total attribute investment
  const attributes = ['hp', 'attack', 'defense', 'speed', 'special'];
  const totalAttributeLevels = attributes.reduce(
    (sum, attr) => sum + getHolobotAttributeLevel(holobotName, attr),
    0
  );

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Legendary': return '#ffd700';
      case 'Elite': return '#ff6b6b';
      case 'Rare': return '#4ecdc4';
      case 'Champion': return '#45b7d1';
      case 'Starter': return '#96ceb4';
      default: return '#95a5a6';
    }
  };

  return (
    <TouchableOpacity style={styles.holobotCard} onPress={onPress}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.holobotName}>{holobotName}</Text>
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      </View>

      {/* Level */}
      <View style={styles.levelContainer}>
        <Text style={styles.levelLabel}>Level</Text>
        <Text style={styles.levelValue}>{level}</Text>
      </View>

      {/* Sync Bond */}
      <View style={styles.syncBondContainer}>
        <View style={styles.syncBondHeader}>
          <Text style={styles.syncBondLabel}>Sync Bond</Text>
          <Text style={styles.syncBondLevel}>Lv.{syncBond.level}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${syncBond.progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{syncBond.progress}%</Text>
      </View>

      {/* Bonuses */}
      <View style={styles.bonusesContainer}>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>Ability:</Text>
          <Text style={styles.bonusValue}>+{syncBond.abilityBoost}%</Text>
        </View>
        <View style={styles.bonusRow}>
          <Text style={styles.bonusLabel}>Parts:</Text>
          <Text style={styles.bonusValue}>+{syncBond.partCompatibility}%</Text>
        </View>
      </View>

      {/* Attribute Upgrades */}
      {totalAttributeLevels > 0 && (
        <View style={styles.attributeContainer}>
          <Text style={styles.attributeLabel}>
            Attribute Upgrades: {totalAttributeLevels}
          </Text>
        </View>
      )}

      {/* Special Move */}
      {holobotStats?.specialMove && (
        <View style={styles.specialMoveContainer}>
          <Text style={styles.specialMoveLabel}>Special:</Text>
          <Text style={styles.specialMoveText}>{holobotStats.specialMove}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HolobotCollectionScreen: React.FC = () => {
  const { user } = useAuth();
  const { calculateStats, getAvailableSyncPoints } = useSyncPointsStore();
  
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const availableSP = getAvailableSyncPoints();
  const userHolobots = user?.holobots || [];

  // Get all available Holobots (for discovery)
  const allHolobots = Object.values(HOLOBOT_STATS);
  const ownedHolobotNames = userHolobots.map(h => h.name.toLowerCase());
  const unownedHolobots = allHolobots.filter(
    h => !ownedHolobotNames.includes(h.name.toLowerCase())
  );

  const handleHolobotPress = (holobotName: string) => {
    // Navigate to HolobotDetail screen (would need navigation setup)
    console.log('Selected Holobot:', holobotName);
    // For now, we'll show an alert with instructions
    Alert.alert(
      `${holobotName} Details`,
      `This would navigate to ${holobotName}'s detailed page with:\n\n• Sync Bond progression\n• Attribute upgrades\n• Training history\n• Special abilities\n\nComing soon in the next update!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Holobot Collection</Text>
          <View style={styles.spContainer}>
            <Text style={styles.spLabel}>Available SP:</Text>
            <Text style={styles.spValue}>{availableSP}</Text>
          </View>
        </View>

        {/* Owned Holobots */}
        {userHolobots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holobots ({userHolobots.length})</Text>
            <View style={styles.holobotsGrid}>
              {userHolobots.map((holobot, index) => (
                <HolobotCard
                  key={`${holobot.name}-${index}`}
                  holobotName={holobot.name}
                  level={holobot.level}
                  onPress={() => handleHolobotPress(holobot.name)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Getting Started Guide */}
        {userHolobots.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No Holobots Yet</Text>
            <Text style={styles.emptyStateText}>
              Visit the main Holobots app to mint your first Holobot, then return here to start building Sync Bonds!
            </Text>
            <View style={styles.guideContainer}>
              <Text style={styles.guideTitle}>🚀 Get Started:</Text>
              <Text style={styles.guideStep}>1. Visit holobots.fun on your browser</Text>
              <Text style={styles.guideStep}>2. Connect your wallet and mint Holobots</Text>
              <Text style={styles.guideStep}>3. Return to HoloSync to build bonds</Text>
              <Text style={styles.guideStep}>4. Use fitness to upgrade your Holobots!</Text>
            </View>
          </View>
        )}

        {/* Available Holobots Discovery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover All Holobots</Text>
          <Text style={styles.sectionSubtitle}>
            All 12 unique Holobots available in the Holobots universe
          </Text>
          <View style={styles.holobotsGrid}>
            {allHolobots.map((holobot, index) => {
              const isOwned = ownedHolobotNames.includes(holobot.name.toLowerCase());
              return (
                <View 
                  key={`${holobot.name}-${index}`} 
                  style={[styles.discoveryCard, isOwned && styles.ownedCard]}
                >
                  <Text style={styles.discoveryName}>{holobot.name}</Text>
                  <Text style={styles.discoverySpecial}>{holobot.specialMove}</Text>
                  <View style={styles.discoveryStats}>
                    <Text style={styles.statText}>ATK: {holobot.attack}</Text>
                    <Text style={styles.statText}>DEF: {holobot.defense}</Text>
                    <Text style={styles.statText}>SPD: {holobot.speed}</Text>
                    <Text style={styles.statText}>HP: {holobot.maxHealth}</Text>
                  </View>
                  {isOwned && (
                    <View style={styles.ownedBadge}>
                      <Text style={styles.ownedBadgeText}>OWNED</Text>
                    </View>
                  )}
                  {!isOwned && (
                    <Text style={styles.notOwnedText}>Available on holobots.fun</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Sync Bond Guide */}
        <View style={styles.guideSection}>
          <Text style={styles.guideSectionTitle}>🔗 Sync Bond System</Text>
          <View style={styles.guideContent}>
            <Text style={styles.guideText}>
              • <Text style={styles.highlight}>Build bonds</Text> with your Holobots through fitness activity
            </Text>
            <Text style={styles.guideText}>
              • <Text style={styles.highlight}>Sync Training</Text> with specific Holobots for faster bonding
            </Text>
            <Text style={styles.guideText}>
              • Higher bond levels provide <Text style={styles.highlight}>ability boosts</Text> and <Text style={styles.highlight}>part compatibility</Text>
            </Text>
            <Text style={styles.guideText}>
              • Use Sync Points to <Text style={styles.highlight}>upgrade attributes</Text> permanently
            </Text>
            <Text style={styles.guideText}>
              • Each Holobot has unique special moves and stat distributions
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  spContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  spLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  spValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.base,
  },
  holobotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  holobotCard: {
    width: cardWidth,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  holobotName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  rankBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  rankText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.background,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  levelLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  levelValue: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  syncBondContainer: {
    marginBottom: spacing.sm,
  },
  syncBondHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncBondLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  syncBondLevel: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#9b59b6',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9b59b6',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'right',
  },
  bonusesContainer: {
    marginBottom: spacing.sm,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bonusLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  bonusValue: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: '#9b59b6',
  },
  attributeContainer: {
    marginBottom: spacing.sm,
  },
  attributeLabel: {
    fontSize: typography.xs,
    color: colors.primary,
    textAlign: 'center',
  },
  specialMoveContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  specialMoveLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  specialMoveText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  guideContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  guideTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  guideStep: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  discoveryCard: {
    width: cardWidth,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.7,
  },
  ownedCard: {
    opacity: 1,
    borderColor: colors.primary,
  },
  discoveryName: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  discoverySpecial: {
    fontSize: typography.sm,
    color: colors.primary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  discoveryStats: {
    marginBottom: spacing.sm,
  },
  statText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  ownedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  ownedBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.background,
  },
  notOwnedText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  guideSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideSectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.base,
  },
  guideContent: {
    gap: spacing.sm,
  },
  guideText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  highlight: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
});

export default HolobotCollectionScreen; 