import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/auth';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { user, login, signup, loading: authLoading } = useAuth();

  // Clear form when switching between login/signup
  useEffect(() => {
    setEmail('');
    setPassword('');
    setUsername('');
  }, [isSignUp]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    // Email validation
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Username validation for signup
    if (isSignUp && username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email.trim(), password, username.trim());
        Alert.alert(
          'Account Created!',
          'Please check your email to verify your account, then sign in.',
          [
            {
              text: 'OK',
              onPress: () => setIsSignUp(false),
            },
          ]
        );
      } else {
        await login(email.trim(), password);
        // Navigation will be handled by AuthProvider
      }
    } catch (error) {
      console.error('Auth error:', error);
      // Error is already handled by AuthProvider with Alert
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available soon. Please contact support if you need assistance.',
      [{ text: 'OK' }]
    );
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>HoloSync</Text>
            <Text style={styles.tagline}>Turn your steps into Sync Points</Text>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Sign up to start your journey' : 'Sign in to continue'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkboxText}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Switch between login/signup */}
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>🚀 Coming Features:</Text>
            <Text style={styles.featuresText}>
              🏃 Track your daily steps and workouts{'\n'}
              ⚡ Earn Sync Points for every step you take{'\n'}
              🤖 Train and upgrade your Holobots with fitness activity{'\n'}
              🏆 Compete in fitness leaderboards{'\n'}
              🎁 Unlock exclusive rewards for staying active
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#37C9FF',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#37C9FF',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#37C9FF',
  },
  checkboxText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
  },
  authButton: {
    backgroundColor: '#37C9FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonDisabled: {
    backgroundColor: '#333',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  forgotPasswordButton: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#37C9FF',
  },
  switchContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  switchButton: {
    padding: 10,
  },
  switchButtonText: {
    fontSize: 14,
    color: '#37C9FF',
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37C9FF',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37C9FF',
    marginBottom: 10,
  },
  featuresText: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
});

export default AuthScreen; 