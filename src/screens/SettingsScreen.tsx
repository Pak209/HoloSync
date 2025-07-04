import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [healthKitEnabled, setHealthKitEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [stepGoalReminders, setStepGoalReminders] = useState(true);

  const handleHealthKitToggle = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'Disable HealthKit?',
        'This will stop automatic step tracking and Sync Points earning. You can re-enable it anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => setHealthKitEnabled(false)
          },
        ]
      );
    } else {
      setHealthKitEnabled(true);
    }
  };

  const handleDataExport = () => {
    Alert.alert(
      'Export Data',
      'Data export functionality will be available soon. Your data will include step history, Sync Points earned, and achievement progress.',
      [{ text: 'OK' }]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your local fitness data. Your account and Sync Points on the server will remain unchanged. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Reset', 'Local data has been reset.');
          }
        },
      ]
    );
  };

  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
  }> = ({ title, subtitle, value, onValueChange, onPress, showArrow = false }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#333', true: '#37C9FF' }}
          thumbColor={value ? '#000' : '#666'}
        />
      )}
      {showArrow && !onValueChange && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Fitness Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Tracking</Text>
          
          <SettingRow
            title="HealthKit Integration"
            subtitle="Allow automatic step tracking from iOS Health app"
            value={healthKitEnabled}
            onValueChange={handleHealthKitToggle}
          />
          
          <SettingRow
            title="Auto-Sync"
            subtitle="Automatically sync Sync Points to server"
            value={autoSyncEnabled}
            onValueChange={setAutoSyncEnabled}
          />
          
          <SettingRow
            title="Step Goal Reminders"
            subtitle="Get notified when you're close to your daily goal"
            value={stepGoalReminders}
            onValueChange={setStepGoalReminders}
          />
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingRow
            title="Push Notifications"
            subtitle="Receive notifications for achievements and reminders"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingRow
            title="Export Data"
            subtitle="Download your fitness data"
            onPress={handleDataExport}
            showArrow
          />
          
          <SettingRow
            title="Reset Local Data"
            subtitle="Clear all local fitness data"
            onPress={handleResetData}
            showArrow
          />
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>HoloSync v1.0.0</Text>
            <Text style={styles.infoSubtext}>
              Turn your daily steps into Sync Points for the Holobots universe.
            </Text>
            <Text style={styles.infoSubtext}>
              Visit holobots.fun for the full experience.
            </Text>
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <SettingRow
            title="FAQ"
            subtitle="Frequently asked questions"
            onPress={() => Alert.alert('FAQ', 'FAQ section coming soon!')}
            showArrow
          />
          
          <SettingRow
            title="Contact Support"
            subtitle="Get help with the app"
            onPress={() => Alert.alert('Support', 'Support contact information will be available soon.')}
            showArrow
          />
          
          <SettingRow
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => Alert.alert('Privacy', 'Privacy policy will be available soon.')}
            showArrow
          />
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 20,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default SettingsScreen; 