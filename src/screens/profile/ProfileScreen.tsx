import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncStore } from '../../store/useSyncStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuthStore } from '../../store/useAuthStore';
import { getLastSyncTime } from '../../services/syncService';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { APP_NAME, APP_VERSION } from '../../utils/constants';

const PROFILE_KEY = '@fishermart_profile';

export const ProfileScreen: React.FC = () => {
  const { isSyncing, pendingCount, triggerSync } = useSyncStore();
  const { isConnected, connectionType } = useNetworkStatus();
  const { profile: authProfile, logout } = useAuthStore();
  const [lastSync, setLastSync] = useState<string | null>(null);

  const [name, setName] = useState(authProfile?.name ?? '');
  const [phone, setPhone] = useState(authProfile?.phone ?? '');
  const [zone, setZone] = useState(authProfile?.zone ?? '');
  const [boatNumber, setBoatNumber] = useState(authProfile?.boat_number ?? '');
  const [autoSync, setAutoSync] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadProfile();
    getLastSyncTime().then(setLastSync);
  }, []);

  const loadProfile = async () => {
    const saved = await AsyncStorage.getItem(PROFILE_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      setName(p.name ?? '');
      setPhone(p.phone ?? '');
      setZone(p.zone ?? '');
      setBoatNumber(p.boat_number ?? '');
    }
  };

  const saveProfile = async () => {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
      name, phone, zone, boat_number: boatNumber,
    }));
    setEditMode(false);
    Alert.alert('Saved', 'Profile updated successfully');
  };

  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert('Offline', 'You need an internet connection to sync data.');
      return;
    }
    await triggerSync();
    getLastSyncTime().then(setLastSync);
    Alert.alert('Sync Complete', 'Your data has been synced to the server.');
  };

  const formatSyncTime = () => {
    if (!lastSync) return 'Never synced';
    const d = new Date(lastSync);
    return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || 'Fisher Profile'}</Text>
            <Text style={styles.profileSub}>{zone ? `${zone}, Delta State` : 'Delta State Fishing Community'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => editMode ? saveProfile() : setEditMode(true)}
          >
            <Ionicons name={editMode ? 'checkmark' : 'pencil-outline'} size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <ProfileField label="Full Name" value={name} onChangeText={setName} editable={editMode} icon="person-outline" />
            <ProfileField label="Phone Number" value={phone} onChangeText={setPhone} editable={editMode} icon="call-outline" keyboardType="phone-pad" />
            <ProfileField label="Zone / LGA" value={zone} onChangeText={setZone} editable={editMode} icon="location-outline" />
            <ProfileField label="Boat Number" value={boatNumber} onChangeText={setBoatNumber} editable={editMode} icon="boat-outline" />
          </View>
          {editMode && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Connectivity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connectivity</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.success : Colors.error }]} />
              <Text style={styles.statusLabel}>{isConnected ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statusType}>{connectionType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.infoLabel}>Last Sync</Text>
                <Text style={styles.infoValue}>{formatSyncTime()}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.infoLabel}>Pending Sync Items</Text>
                <Text style={[styles.infoValue, { color: pendingCount > 0 ? Colors.warning : Colors.success }]}>
                  {pendingCount} items
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="settings-outline" size={16} color={Colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Auto Sync when Online</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ true: Colors.primary, false: Colors.border }}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.syncBtn, !isConnected && { opacity: 0.6 }]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Ionicons name={isSyncing ? 'sync' : 'cloud-upload-outline'} size={18} color={Colors.textInverse} />
            <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="fish-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.infoLabel}>App Name</Text>
                <Text style={styles.infoValue}>{APP_NAME}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="code-slash-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{APP_VERSION}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.infoLabel}>Project</Text>
                <Text style={styles.infoValue}>FYP — Delta State University</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileField: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void;
  editable?: boolean; icon: string; keyboardType?: 'default' | 'phone-pad';
}> = ({ label, value, onChangeText, editable, icon, keyboardType = 'default' }) => (
  <View style={pfStyles.row}>
    <View style={pfStyles.iconWrap}>
      <Ionicons name={icon as any} size={16} color={Colors.textSecondary} />
    </View>
    <View style={pfStyles.textWrap}>
      <Text style={pfStyles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={pfStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={pfStyles.value}>{value || '—'}</Text>
      )}
    </View>
  </View>
);

const pfStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  iconWrap: {
    width: 34, height: 34, backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  label: { ...Typography.caption, color: Colors.textMuted },
  value: { ...Typography.labelMD, color: Colors.textPrimary },
  input: {
    ...Typography.labelMD, color: Colors.textPrimary, borderBottomWidth: 1,
    borderColor: Colors.primary, paddingVertical: 4,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    ...Shadow.md, marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64, height: 64, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40',
  },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.headingSM, color: Colors.textPrimary },
  profileSub: { ...Typography.bodySM, color: Colors.textMuted, marginTop: 2 },
  editBtn: {
    width: 38, height: 38, backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center',
  },

  section: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.labelSM, color: Colors.textSecondary, marginBottom: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.base, ...Shadow.sm,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.sm },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: BorderRadius.full },
  statusLabel: { ...Typography.labelMD, color: Colors.textPrimary, flex: 1 },
  statusType: { ...Typography.caption, color: Colors.textMuted },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoLabel: { ...Typography.caption, color: Colors.textMuted },
  infoValue: { ...Typography.labelMD, color: Colors.textPrimary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', marginTop: Spacing.md,
  },
  saveBtnText: { ...Typography.labelLG, color: Colors.textInverse },

  syncBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg, marginTop: Spacing.md, ...Shadow.colored(Colors.primary),
  },
  syncBtnText: { ...Typography.labelLG, color: Colors.textInverse },
  badge: {
    backgroundColor: Colors.warning, borderRadius: BorderRadius.full,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '700', fontSize: 10 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.error + '12', borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { ...Typography.labelMD, color: Colors.error },
});
