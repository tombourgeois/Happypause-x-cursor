import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Switch,
  Linking,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import {
  getProfile,
  saveProfile,
  uploadAvatar,
  setAvatarUrl,
  getAvatarUrl,
} from '../services/profileService';
import { getStats } from '../services/statsService';
import { apiPost, apiGet } from '../services/api';
import type { UserProfile } from '../types';

const TIMEZONES = [
  'GMT-12:00', 'GMT-11:00', 'GMT-10:00', 'GMT-09:00', 'GMT-08:00', 'GMT-07:00', 'GMT-06:00', 'GMT-05:00',
  'GMT-04:00', 'GMT-03:30', 'GMT-03:00', 'GMT-02:00', 'GMT-01:00', 'GMT+00:00',
  'GMT+01:00', 'GMT+02:00', 'GMT+03:00', 'GMT+03:30', 'GMT+04:00', 'GMT+04:30', 'GMT+05:00', 'GMT+05:30',
  'GMT+05:45', 'GMT+06:00', 'GMT+06:30', 'GMT+07:00', 'GMT+08:00', 'GMT+09:00', 'GMT+09:30', 'GMT+10:00',
  'GMT+11:00', 'GMT+12:00', 'GMT+13:00', 'GMT+14:00',
];
const COUNTRIES = ['Canada', 'United States', 'France', 'United Kingdom', 'Germany', 'Japan', 'Australia', 'Other'];
const LANGUAGES = ['EN', 'FR'];

interface ProfileTabProps {
  openSettings: () => void;
}

export default function ProfileTab({ openSettings }: ProfileTabProps) {
  const { user, isAuthenticated, hasCompletedAuth, login, register, logout, forgotPassword, resetPassword, applyTokens } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState<{ totalPausesDone: number; dayStreak: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Avatar modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Change email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStage, setEmailStage] = useState(0);
  const [emailOldCode, setEmailOldCode] = useState('');
  const [emailNewAddr, setEmailNewAddr] = useState('');
  const [emailNewCode, setEmailNewCode] = useState('');
  const [emailError, setEmailError] = useState('');

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passStage, setPassStage] = useState<'code' | 'reset'>('code');
  const [passCode, setPassCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (hasCompletedAuth) {
      getStats().then((s) => setProfileStats({
        totalPausesDone: s.totalPausesDone ?? 0,
        dayStreak: s.dayStreak ?? 0,
      })).catch(() => setProfileStats(null));
    }
  }, [hasCompletedAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      getProfile()
        .then(setProfile)
        .catch(() => {
          if (user) {
            setProfile({
              firstName: '',
              surname: '',
              familyName: '',
              email: user.email,
              timezone: 'GMT+00:00',
              country: '',
              avatarUrl: '',
              language: 'EN',
              notificationSound: true,
              notificationVibration: true,
            });
          } else {
            setProfile(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (profile && isAuthenticated) {
      saveProfile(profile).catch(() => {});
    }
  }, [profile, isAuthenticated]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0] && profile) {
      const asset = result.assets[0];
      setAvatarUploading(true);
      try {
        const avatarUrl = await uploadAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
        setProfile({ ...profile, avatarUrl });
        setShowAvatarModal(false);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not upload image.';
        Alert.alert('Upload failed', msg + '\n\nMake sure the app can reach the API (use your computer IP if on a physical device).');
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  const handleAvatarUrlSubmit = async () => {
    if (avatarUrlInput && profile) {
      try {
        const url = avatarUrlInput.startsWith('http') ? avatarUrlInput : `https://${avatarUrlInput}`;
        await setAvatarUrl(url);
        setProfile({ ...profile, avatarUrl: url });
        setShowAvatarModal(false);
        setAvatarUrlInput('');
      } catch {
        Alert.alert('Error', 'Invalid URL.');
      }
    }
  };

  const requestOldEmailCode = async () => {
    setEmailError('');
    try {
      await apiPost('/auth/change-email/request', {});
      setEmailStage(1);
    } catch {
      setEmailError('Failed to send code');
    }
  };

  const verifyOldEmailCode = async () => {
    setEmailError('');
    try {
      await apiPost('/auth/change-email/verify-old', { code: emailOldCode });
      setEmailStage(2);
    } catch (e) {
      setEmailError((e as Error).message || 'Invalid code');
    }
  };

  const requestNewEmailCode = async () => {
    setEmailError('');
    if (!emailNewAddr || !emailNewAddr.includes('@')) {
      setEmailError('Invalid email format');
      return;
    }
    try {
      await apiPost('/auth/change-email/request-new', { newEmail: emailNewAddr });
      setEmailStage(3);
    } catch (e) {
      setEmailError((e as Error).message || 'Failed');
    }
  };

  const verifyNewEmailCode = async () => {
    setEmailError('');
    try {
      const res = await apiPost<{ email: string; userId: string; accessToken: string; refreshToken: string }>(
        '/auth/change-email/verify-new',
        { code: emailNewCode }
      );
      applyTokens(res.accessToken, res.refreshToken, res.userId, res.email);
      if (profile) setProfile({ ...profile, email: res.email });
      setShowEmailModal(false);
      setEmailStage(0);
      setEmailOldCode('');
      setEmailNewAddr('');
      setEmailNewCode('');
    } catch (e) {
      setEmailError((e as Error).message || 'Invalid code');
    }
  };

  const requestPasswordCode = async () => {
    setPassError('');
    try {
      await apiPost('/auth/change-password', {});
      setPassStage('code');
    } catch {
      setPassError('Failed to send code');
    }
  };

  const saveNewPassword = async () => {
    setPassError('');
    if (newPass !== confirmPass) {
      setPassError('Passwords do not match');
      return;
    }
    if (newPass.length < 8) {
      setPassError('Password must be at least 8 characters');
      return;
    }
    try {
      await apiPost('/auth/change-password/verify', { code: passCode, newPassword: newPass });
      setShowPasswordModal(false);
      setPassStage('code');
      setPassCode('');
      setNewPass('');
      setConfirmPass('');
    } catch (e) {
      setPassError((e as Error).message || 'Invalid code');
    }
  };

  const requestDeleteCode = async () => {
    setDeleteError('');
    try {
      await apiPost('/auth/delete-account', {});
    } catch {
      setDeleteError('Failed to send code');
    }
  };

  const confirmDeleteAccount = async () => {
    setDeleteError('');
    try {
      await apiPost('/auth/delete-account/confirm', { code: deleteCode });
      setShowDeleteModal(false);
      setDeleteCode('');
      logout();
    } catch (e) {
      setDeleteError((e as Error).message || 'Invalid code');
    }
  };

  const handleDownloadData = async () => {
    try {
      const data = await apiGet<unknown>('/auth/download-data');
      Alert.alert('Data exported', 'Your data has been exported. In a full implementation, this would download a file.');
    } catch {
      Alert.alert('Error', 'Could not export data.');
    }
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primarySage} />
      </View>
    );
  }

  const displayName = profile && (profile.firstName || profile.surname || profile.familyName)
    ? `${profile.firstName} ${profile.surname} ${profile.familyName}`.trim()
    : profile?.email?.split('@')[0] || 'Guest';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={18} color={COLORS.charcoal} />
          </View>
          <Text style={styles.headerTitle}>HappyPause</Text>
        </View>
      </View>
      <Text style={styles.pageTitle}>Profile</Text>

      {!isAuthenticated ? (
        <View style={styles.section}>
          <View style={styles.guestCard}>
            <Text style={styles.guestLabel}>Guest mode</Text>
            <Text style={styles.guestText}>You are using the app as a guest.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAuth(true)} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Log in / Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back to login screen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="items-center mt-4 mb-8">
            <TouchableOpacity onPress={() => setShowAvatarModal(true)} className="relative">
              <View className="w-28 h-28 rounded-full bg-sage/20 border-2 border-sage overflow-hidden items-center justify-center">
                {profile?.avatarUrl ? (
                  <Image
                    source={{ uri: getAvatarUrl(profile.avatarUrl) || profile.avatarUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={48} color="#b1b7a2" />
                )}
              </View>
              <View className="absolute inset-0 bg-charcoal/50 rounded-full items-center justify-center opacity-0">
                <Ionicons name="camera" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text className="text-offWhite text-xl font-bold mt-4">{displayName}</Text>
            <Text className="text-sage text-sm">{profile?.email}</Text>
          </View>

          {profileStats && (
            <View style={styles.statsAtGlance}>
              <Text style={styles.statsSectionLabel}>Stats at a glance</Text>
              <View style={styles.statsCards}>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={28} color={COLORS.zenAccent} />
                  <View>
                    <Text style={styles.statValue}>{profileStats.totalPausesDone}</Text>
                    <Text style={styles.statLabel}>Pauses Done</Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="flame" size={28} color={COLORS.vibrantGreen} />
                  <View>
                    <Text style={styles.statValue}>{profileStats.dayStreak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View className="px-6">
            <Text className="text-offWhite/60 text-xs font-bold uppercase tracking-widest mb-2 px-2">Account</Text>

            {/* Personal info */}
            <TouchableOpacity
              onPress={() => toggleSection('personal')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="person" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Personal info</Text>
              </View>
              <Ionicons name={expandedSection === 'personal' ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>
            {expandedSection === 'personal' && profile && (
              <View className="bg-offWhite/5 rounded-xl p-4 mb-3 -mt-2 pt-2 border-t border-offWhite/5">
                <Text className="text-sage text-xs font-bold uppercase mb-2">Name</Text>
                <TextInput
                  value={profile.firstName}
                  onChangeText={(t) => setProfile({ ...profile, firstName: t })}
                  placeholder="First name"
                  placeholderTextColor="#888"
                  className="bg-charcoal rounded-lg p-3 text-offWhite mb-2"
                />
                <TextInput
                  value={profile.surname}
                  onChangeText={(t) => setProfile({ ...profile, surname: t })}
                  placeholder="Surname"
                  placeholderTextColor="#888"
                  className="bg-charcoal rounded-lg p-3 text-offWhite mb-2"
                />
                <TextInput
                  value={profile.familyName}
                  onChangeText={(t) => setProfile({ ...profile, familyName: t })}
                  placeholder="Family name"
                  placeholderTextColor="#888"
                  className="bg-charcoal rounded-lg p-3 text-offWhite mb-2"
                />
                <Text className="text-sage text-xs font-bold uppercase mt-2 mb-2">Email</Text>
                <TouchableOpacity
                  onPress={() => setShowEmailModal(true)}
                  className="bg-charcoal rounded-lg p-3 flex-row items-center"
                >
                  <Ionicons name="mail" size={16} color="#888" />
                  <Text className="text-offWhite ml-2 flex-1">{profile.email}</Text>
                </TouchableOpacity>
                <Text className="text-sage text-xs font-bold uppercase mt-2 mb-2">Language</Text>
                <View className="flex-row gap-2">
                  {LANGUAGES.map((l) => (
                    <TouchableOpacity
                      key={l}
                      onPress={() => setProfile({ ...profile, language: l as 'EN' | 'FR' })}
                      className={`flex-1 py-2 rounded-lg ${profile.language === l ? 'bg-sage' : 'bg-offWhite/10'}`}
                    >
                      <Text className={`text-center font-bold ${profile.language === l ? 'text-charcoal' : 'text-offWhite'}`}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-sage text-xs font-bold uppercase mt-2 mb-2">Timezone</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                  {TIMEZONES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setProfile({ ...profile, timezone: t })}
                      className={`px-3 py-2 rounded-lg mr-2 ${profile.timezone === t ? 'bg-sage' : 'bg-offWhite/10'}`}
                    >
                      <Text className={profile.timezone === t ? 'text-charcoal font-bold' : 'text-offWhite'}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text className="text-sage text-xs font-bold uppercase mt-2 mb-2">Country</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setProfile({ ...profile, country: c })}
                      className={`px-3 py-2 rounded-lg mr-2 ${profile.country === c ? 'bg-sage' : 'bg-offWhite/10'}`}
                    >
                      <Text className={profile.country === c ? 'text-charcoal font-bold' : 'text-offWhite'}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => toggleSection('notifications')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="notifications" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Notifications</Text>
              </View>
              <Ionicons name={expandedSection === 'notifications' ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>
            {expandedSection === 'notifications' && profile && (
              <View className="bg-offWhite/5 rounded-xl p-4 mb-3 -mt-2 pt-2 border-t border-offWhite/5">
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-offWhite">Sound</Text>
                  <Switch
                    value={profile.notificationSound}
                    onValueChange={(v) => setProfile({ ...profile, notificationSound: v })}
                    trackColor={{ false: '#444', true: '#b1b7a2' }}
                    thumbColor="#fff"
                  />
                </View>
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-offWhite">Vibration</Text>
                  <Switch
                    value={profile.notificationVibration}
                    onValueChange={(v) => setProfile({ ...profile, notificationVibration: v })}
                    trackColor={{ false: '#444', true: '#b1b7a2' }}
                    thumbColor="#fff"
                  />
                </View>
                <TouchableOpacity onPress={openSystemSettings} className="py-3 border-t border-offWhite/10">
                  <Text className="text-offWhite/70 text-sm">Open system settings</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Security */}
            <TouchableOpacity
              onPress={() => toggleSection('security')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="shield-checkmark" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Security</Text>
              </View>
              <Ionicons name={expandedSection === 'security' ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>
            {expandedSection === 'security' && (
              <View className="bg-offWhite/5 rounded-xl p-4 mb-3 -mt-2 pt-2 border-t border-offWhite/5">
                <TouchableOpacity
                  onPress={() => { setShowPasswordModal(true); setPassStage('code'); requestPasswordCode(); }}
                  className="flex-row justify-between items-center py-3"
                >
                  <Text className="text-offWhite">Change password</Text>
                  <Ionicons name="chevron-forward" size={24} color="#888" />
                </TouchableOpacity>
              </View>
            )}

            {/* Support */}
            <Text className="text-offWhite/60 text-xs font-bold uppercase tracking-widest mb-2 px-2 mt-6">Support</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.ajis.ca/legal')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="document-text" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:info@ajis.ca')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="help-circle" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>

            {/* Data & Privacy */}
            <TouchableOpacity
              onPress={() => toggleSection('data')}
              className="bg-offWhite/5 rounded-xl p-4 mb-3 flex-row justify-between items-center"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-lg bg-sage/10 items-center justify-center">
                  <Ionicons name="document-text" size={18} color="#b1b7a2" />
                </View>
                <Text className="text-offWhite font-medium">Your data</Text>
              </View>
              <Ionicons name={expandedSection === 'data' ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>
            {expandedSection === 'data' && (
              <View className="bg-offWhite/5 rounded-xl p-4 mb-3 -mt-2 pt-2 border-t border-offWhite/5">
                <TouchableOpacity onPress={handleDownloadData} className="flex-row items-center gap-3 py-3">
                  <Ionicons name="download" size={20} color="#b1b7a2" />
                  <Text className="text-offWhite">Download my data</Text>
                </TouchableOpacity>
                <View className="pt-4 border-t border-offWhite/10">
                  <Text className="text-red-400 text-xs font-bold uppercase mb-2">Danger zone</Text>
                  <TouchableOpacity
                    onPress={() => { setShowDeleteModal(true); requestDeleteCode(); }}
                    className="flex-row items-center gap-3 py-3"
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                    <Text className="text-red-400 font-bold">Delete account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity onPress={logout} className="bg-red-500/20 border border-red-400/30 rounded-xl py-4 mt-6">
              <Text className="text-red-400 font-bold text-center">Log out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity onPress={openSettings} style={[styles.primaryBtn, styles.settingsBtn]}>
        <Text style={styles.primaryBtnText}>Settings</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>HappyPause v1.0.2</Text>
      {user?.userId && (
        <Text style={styles.userIdText}>User ID: {user.userId}</Text>
      )}

      {/* Avatar modal */}
      {showAvatarModal && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
          <View className="bg-charcoal rounded-2xl w-full max-w-sm p-6">
            <Text className="text-offWhite text-lg font-bold mb-4">Change avatar</Text>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={avatarUploading}
              className="flex-row items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-sage/40 mb-4"
            >
              {avatarUploading ? (
                <ActivityIndicator color="#b1b7a2" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#b1b7a2" />
                  <Text className="text-sage font-bold">Upload photo</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-offWhite/50 text-center text-xs mb-2">or</Text>
            <TextInput
              value={avatarUrlInput}
              onChangeText={setAvatarUrlInput}
              placeholder="Paste image URL"
              placeholderTextColor="#888"
              className="bg-offWhite/10 rounded-xl p-3 text-offWhite mb-4"
            />
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowAvatarModal(false)} className="flex-1 py-3 rounded-xl bg-offWhite/10">
                <Text className="text-offWhite text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAvatarUrlSubmit} className="flex-1 py-3 rounded-xl bg-sage">
                <Text className="text-charcoal font-bold text-center">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Email modal */}
      {showEmailModal && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
          <View className="bg-charcoal rounded-2xl w-full max-w-sm p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-offWhite text-lg font-bold">Change email</Text>
              <TouchableOpacity onPress={() => { setShowEmailModal(false); setEmailStage(0); setEmailError(''); }}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {emailStage === 0 && (
              <>
                <Text className="text-offWhite/70 text-sm mb-4">Request a code to your current email.</Text>
                <TouchableOpacity onPress={requestOldEmailCode} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Send code</Text>
                </TouchableOpacity>
              </>
            )}
            {emailStage === 1 && (
              <>
                <TextInput
                  value={emailOldCode}
                  onChangeText={setEmailOldCode}
                  placeholder="Enter code"
                  placeholderTextColor="#888"
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite text-center text-lg mb-4"
                />
                {emailError ? <Text className="text-red-400 text-sm mb-2">{emailError}</Text> : null}
                <TouchableOpacity onPress={verifyOldEmailCode} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Verify</Text>
                </TouchableOpacity>
              </>
            )}
            {emailStage === 2 && (
              <>
                <TextInput
                  value={emailNewAddr}
                  onChangeText={setEmailNewAddr}
                  placeholder="New email"
                  placeholderTextColor="#888"
                  keyboardType="email-address"
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite mb-4"
                />
                {emailError ? <Text className="text-red-400 text-sm mb-2">{emailError}</Text> : null}
                <TouchableOpacity onPress={requestNewEmailCode} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Send code to new email</Text>
                </TouchableOpacity>
              </>
            )}
            {emailStage === 3 && (
              <>
                <Text className="text-offWhite/70 text-sm mb-4">Enter the code sent to {emailNewAddr}</Text>
                <TextInput
                  value={emailNewCode}
                  onChangeText={setEmailNewCode}
                  placeholder="Code"
                  placeholderTextColor="#888"
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite text-center text-lg mb-4"
                />
                {emailError ? <Text className="text-red-400 text-sm mb-2">{emailError}</Text> : null}
                <TouchableOpacity onPress={verifyNewEmailCode} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Confirm change</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
          <View className="bg-charcoal rounded-2xl w-full max-w-sm p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-offWhite text-lg font-bold">{passStage === 'code' ? 'Verify code' : 'New password'}</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {passStage === 'code' ? (
              <>
                <Text className="text-offWhite/70 text-sm mb-4">Enter the code sent to your email.</Text>
                <TextInput
                  value={passCode}
                  onChangeText={setPassCode}
                  placeholder="Enter code"
                  placeholderTextColor="#888"
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite text-center text-lg mb-4"
                />
                {passError ? <Text className="text-red-400 text-sm mb-2">{passError}</Text> : null}
                <TouchableOpacity onPress={() => setPassStage('reset')} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Next</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  value={newPass}
                  onChangeText={setNewPass}
                  placeholder="New password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite mb-4"
                />
                <TextInput
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  placeholder="Confirm password"
                  placeholderTextColor="#888"
                  secureTextEntry
                  className="bg-offWhite/10 rounded-xl p-3 text-offWhite mb-4"
                />
                {passError ? <Text className="text-red-400 text-sm mb-2">{passError}</Text> : null}
                <TouchableOpacity onPress={saveNewPassword} className="bg-sage rounded-xl py-3">
                  <Text className="text-charcoal font-bold text-center">Save password</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Delete account modal */}
      {showDeleteModal && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
          <View className="bg-charcoal rounded-2xl w-full max-w-sm p-6 border border-red-500/30">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-red-400 text-lg font-bold">Delete account</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            <Text className="text-offWhite/70 text-sm mb-4">Enter the code sent to your email to confirm.</Text>
            <TextInput
              value={deleteCode}
              onChangeText={setDeleteCode}
              placeholder="Enter code"
              placeholderTextColor="#888"
              className="bg-offWhite/10 rounded-xl p-3 text-offWhite text-center text-lg mb-4 border border-red-500/30"
            />
            {deleteError ? <Text className="text-red-400 text-sm mb-2">{deleteError}</Text> : null}
            <TouchableOpacity onPress={confirmDeleteAccount} className="bg-red-500 rounded-xl py-3">
              <Text className="text-white font-bold text-center">Confirm delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AuthModal
        visible={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
        login={login}
        register={register}
        forgotPassword={forgotPassword}
        resetPassword={resetPassword}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.zenText,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
    fontFamily: FONTS.bold,
  },
  section: {
    paddingHorizontal: 24,
  },
  guestCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  guestLabel: {
    fontSize: 14,
    color: 'rgba(245,245,245,0.7)',
    fontFamily: FONTS.regular,
  },
  guestText: {
    fontSize: 16,
    color: COLORS.zenText,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  primaryBtn: {
    backgroundColor: COLORS.primarySage,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  primaryBtnText: {
    color: COLORS.charcoal,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  secondaryBtnText: {
    color: 'rgba(245,245,245,0.6)',
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  settingsBtn: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  versionText: {
    color: 'rgba(245,245,245,0.3)',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
    fontFamily: FONTS.regular,
  },
  userIdText: {
    color: 'rgba(245,245,245,0.25)',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 24,
    fontFamily: FONTS.regular,
  },
  statsAtGlance: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statsSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(245,245,245,0.6)',
    marginBottom: 16,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  statsCards: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(245,245,245,0.6)',
    fontFamily: FONTS.regular,
  },
});
