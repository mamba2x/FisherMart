import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { APP_NAME } from '../../utils/constants';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, loading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Info', 'Please enter your full name and phone number.');
      return;
    }
    clearError();
    const success = await login(name.trim(), phone.trim());
    if (!success) {
      Alert.alert('Login Failed', error ?? 'Incorrect name or phone number. Try again.');
    }
    // Navigation handled by AppNavigator reacting to isLoggedIn state change
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="fish" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.headerSub}>Welcome back, fisher 👋</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSub}>
              Enter your registered name and phone number to continue
            </Text>

            {/* Name Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Iyio Emmanuel"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Phone Field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 08012345678"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  secureTextEntry={!showPhone}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPhone(!showPhone)}>
                  <Ionicons
                    name={showPhone ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Offline note */}
            <View style={styles.offlineNote}>
              <Ionicons name="cloud-offline-outline" size={14} color={Colors.primary} />
              <Text style={styles.offlineNoteText}>
                Sign-in works offline if you've logged in before
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={styles.loginBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={Colors.textInverse} />
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerLabel}>New to FisherMart?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Create Account →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.section,
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  appName: {
    ...Typography.headingXXL,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
  headerSub: { ...Typography.bodyMD, color: 'rgba(255,255,255,0.8)' },

  formCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    ...Shadow.lg,
  },
  formTitle: { ...Typography.headingLG, color: Colors.textPrimary, marginBottom: Spacing.xs },
  formSub: { ...Typography.bodySM, color: Colors.textMuted, marginBottom: Spacing.xl },

  fieldWrap: { marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.labelSM, color: Colors.textSecondary, marginBottom: Spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
  },

  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  offlineNoteText: { ...Typography.caption, color: Colors.primary, flex: 1 },

  loginBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.colored(Colors.primary) },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loginBtnText: { ...Typography.labelLG, color: Colors.textInverse },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  registerLabel: { ...Typography.bodySM, color: Colors.textMuted },
  registerLink: { ...Typography.labelMD, color: Colors.primary },
});
