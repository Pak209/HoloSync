import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/auth';
import { useSyncPointsStore } from '../stores/syncPointsStore';
import AttributeUpgradeComponent from '../components/AttributeUpgradeComponent';
import { HOLOBOT_STATS, getHolobotByName, getRank } from '../types/holobot';
import { colors, spacing, borderRadius, typography } from '../styles/globalStyles';

type RootStackParamList = {
  HolobotDetail: {
    holobotName: string;
  };
};

type HolobotDetailRouteProp = RouteProp<RootStackParamList, 'HolobotDetail'>;

const HolobotDetailScreen: React.FC = () => {
  const route = useRoute<HolobotDetailRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { getHolobotSyncBond } = useSyncPointsStore();
  
  const { holobotName } = route.params;
  
  const holobotStats = getHolobotByName(holobotName);
  const userHolobot = user?.holobots?.find(h => h.name.toLowerCase() === holobotName.toLowerCase());
  const syncBond = getHolobotSyncBond(holobotName);

  if (!holobotStats || !userHolobot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Holobot not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{holobotName}</Text>
            <Text style={styles.subtitle}>
              Level {userHolobot.level} • {getRank(userHolobot.level)}
            </Text>
          </View>
        </View>

        {/* Holobot Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Holobot Information</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{getRank(userHolobot.level)}</Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Attack</Text>
              <Text style={styles.statValue}>{holobotStats.attack}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Defense</Text>
              <Text style={styles.statValue}>{holobotStats.defense}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>{holobotStats.speed}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Health</Text>
              <Text style={styles.statValue}>{holobotStats.maxHealth}</Text>
            </View>
          </View>

          {holobotStats.specialMove && (
            <View style={styles.specialMoveContainer}>
              <Text style={styles.specialMoveLabel}>Special Move:</Text>
              <Text style={styles.specialMoveText}>{holobotStats.specialMove}</Text>
            </View>
          )}

          {holobotStats.abilityDescription && (
            <View style={styles.abilityContainer}>
              <Text style={styles.abilityLabel}>Ability:</Text>
              <Text style={styles.abilityText}>{holobotStats.abilityDescription}</Text>
              {holobotStats.abilityStats && (
                <Text style={styles.abilityStats}>{holobotStats.abilityStats}</Text>
              )}
            </View>
          )}
        </View>

        {/* Sync Bond Card */}
        <View style={styles.syncBondCard}>
          <Text style={styles.syncBondTitle}>
            Sync Bond Level {syncBond.level}
          </Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${syncBond.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{syncBond.progress}% to next level</Text>
          
          <View style={styles.bondStats}>
            <Text style={styles.bondStat}>
              Training Hours: {syncBond.syncTrainingHours.toFixed(1)}
            </Text>
            <Text style={styles.bondStat}>
              Total SP Earned: {syncBond.totalSyncPoints}
            </Text>
          </View>

          <View style={styles.bondBonuses}>
            <View style={styles.bonusItem}>
              <Text style={styles.bonusLabel}>Ability Boost</Text>
              <Text style={styles.bonusValue}>+{syncBond.abilityBoost}%</Text>
            </View>
            <View style={styles.bonusItem}>
              <Text style={styles.bonusLabel}>Part Compatibility</Text>
              <Text style={styles.bonusValue}>+{syncBond.partCompatibility}%</Text>
            </View>
          </View>

          {syncBond.specialUnlocks.length > 0 && (
            <View style={styles.unlocksContainer}>
              <Text style={styles.unlocksTitle}>Special Unlocks:</Text>
              {syncBond.specialUnlocks.map((unlock, index) => (
                <Text key={index} style={styles.unlockText}>• {unlock}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Attribute Upgrade Component */}
        <View style={styles.upgradeContainer}>
          <AttributeUpgradeComponent holobotName={holobotName} />
        </View>

        {/* Training Guide */}
        <View style={styles.guideContainer}>
          <Text style={styles.guideTitle}>🎯 Training Tips</Text>
          <Text style={styles.guideText}>
            • Use <Text style={styles.highlight}>Sync Training</Text> with {holobotName} selected to build your bond faster
          </Text>
          <Text style={styles.guideText}>
            • Higher Sync Bond levels provide <Text style={styles.highlight}>multiplicative bonuses</Text> to all upgrades
          </Text>
          <Text style={styles.guideText}>
            • Spend Sync Points on attributes that complement {holobotName}'s natural strengths
          </Text>
          <Text style={styles.guideText}>
            • {holobotName}'s special move "{holobotStats.specialMove}" benefits most from <Text style={styles.highlight}>Special</Text> upgrades
          </Text>
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.base,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  infoTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  rankBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rankText: {
    color: colors.background,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  specialMoveContainer: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.sm,
  },
  specialMoveLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  specialMoveText: {
    fontSize: typography.base,
    color: colors.primary,
    fontWeight: typography.bold,
  },
  abilityContainer: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
  },
  abilityLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  abilityText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  abilityStats: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
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
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: '#9b59b6',
    textAlign: 'center',
    marginBottom: spacing.sm,
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
  progressText: {
    fontSize: typography.sm,
    color: '#9b59b6',
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  bondStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  bondStat: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  bondBonuses: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.base,
  },
  bonusItem: {
    alignItems: 'center',
  },
  bonusLabel: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  bonusValue: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: '#9b59b6',
  },
  unlocksContainer: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
  },
  unlocksTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: '#9b59b6',
    marginBottom: spacing.sm,
  },
  unlockText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  upgradeContainer: {
    marginBottom: spacing.base,
  },
  guideContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.primary,
    marginBottom: spacing.base,
  },
  guideText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  highlight: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.xl,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});

export default HolobotDetailScreen; 