import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { DELTA_STATE_ZONES } from '../../utils/constants';
import { isValidNigerianPhone } from '../../utils/helpers';

interface RegisterScreenProps {
  navigation: any;
}

const ZONE_OPTIONS = [...DELTA_STATE_ZONES];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, loading, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const [village, setVillage] = useState('');
  const [boatNumber, setBoatNumber] = useState('');
  const [showZonePicker, setShowZonePicker] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Info', 'Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing Info', 'Please enter your phone number.');
      return;
    }
    if (!isValidNigerianPhone(phone.trim())) {
      Alert.alert('Invalid Phone', 'Please enter a valid Nigerian phone number (e.g. 08012345678).');
      return;
    }
    if (!zone) {
      Alert.alert('Missing Info', 'Please select your zone / LGA.');
      return;
    }

    clearError();
    const success = await register({
      name: name.trim(),
      phone: phone.trim(),
      zone,
      village: village.trim(),
      boat_number: boatNumber.trim(),
    });

    if (!success) {
      Alert.alert('Registration Failed', 'Something went wrong. Please try again.');
    }
    // Navigation handled by AppNavigator on isLoggedIn state change
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
            colors={[Colors.secondaryDark, Colors.secondary]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Ionicons name="person-add" size={36} color={Colors.secondary} />
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>Join the Delta State fishing community</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Fisher Registration</Text>
            <Text style={styles.formSub}>
              Your details will be saved locally and used across the app
            </Text>

            {/* Name */}
            <InputField
              label="Full Name *"
              icon="person-outline"
              placeholder="e.g. Iyio Emmanuel Kobimdi"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            {/* Phone */}
            <InputField
              label="Phone Number *"
              icon="call-outline"
              placeholder="e.g. 08012345678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Zone Picker */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Zone / LGA *</Text>
              <TouchableOpacity
                style={[styles.inputRow, styles.pickerRow]}
                onPress={() => setShowZonePicker(!showZonePicker)}
              >
                <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
                <Text style={[styles.pickerText, !zone && { color: Colors.textMuted }]}>
                  {zone || 'Select your LGA...'}
                </Text>
                <Ionicons
                  name={showZonePicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {showZonePicker && (
                <View style={styles.zonePicker}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {ZONE_OPTIONS.map((z) => (
                      <TouchableOpacity
                        key={z}
                        style={[styles.zoneOption, zone === z && styles.zoneOptionActive]}
                        onPress={() => { setZone(z); setShowZonePicker(false); }}
                      >
                        <Text style={[styles.zoneText, zone === z && styles.zoneTextActive]}>
                          {z}
                        </Text>
                        {zone === z && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Village */}
            <InputField
              label="Village / Settlement"
              icon="home-outline"
              placeholder="e.g. Koko, Ogheye"
              value={village}
              onChangeText={setVillage}
              autoCapitalize="words"
            />

            {/* Boat Number */}
            <InputField
              label="Boat Registration Number"
              icon="boat-outline"
              placeholder="e.g. NDS-001"
              value={boatNumber}
              onChangeText={setBoatNumber}
              autoCapitalize="characters"
            />

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.secondary} />
              <Text style={styles.privacyText}>
                Your data is stored securely on your device and synced only when you're online
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Colors.gradientSecondary}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
                    <Text style={styles.btnText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to login */}
            <View style={styles.loginRow}>
              <Text style={styles.loginLabel}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Reusable Input Field ───────────────────────────────────────────────────
const InputField: React.FC<{
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'characters' | 'sentences';
}> = ({ label, icon, placeholder, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences' }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <Ionicons name={icon as any} size={18} color={Colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  </View>
);

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
  backBtn: {
    position: 'absolute',
    top: Spacing.xxxl,
    left: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  headerTitle: { ...Typography.headingXXL, color: Colors.textInverse },
  headerSub: { ...Typography.bodyMD, color: 'rgba(255,255,255,0.8)' },

  formCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
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

  pickerRow: { paddingVertical: Spacing.md },
  pickerText: { ...Typography.bodyMD, color: Colors.textPrimary, flex: 1 },

  zonePicker: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  zoneOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  zoneOptionActive: { backgroundColor: Colors.primary + '10' },
  zoneText: { ...Typography.bodyMD, color: Colors.textPrimary },
  zoneTextActive: { color: Colors.primary, fontWeight: '700' },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondary + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  privacyText: { ...Typography.caption, color: Colors.secondary, flex: 1 },

  registerBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadow.colored(Colors.secondary),
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  btnText: { ...Typography.labelLG, color: Colors.textInverse },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  loginLabel: { ...Typography.bodySM, color: Colors.textMuted },
  loginLink: { ...Typography.labelMD, color: Colors.secondary },
});
