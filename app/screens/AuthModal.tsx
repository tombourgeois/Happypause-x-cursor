import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
  login,
  register,
  forgotPassword,
  resetPassword,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCode('');
    setNewPassword('');
    setError('');
    setCodeSent(false);
    setMode('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    const e = email.trim().toLowerCase();
    if (!e) {
      setError('Email is required');
      return;
    }

    if (mode === 'login') {
      if (!password) {
        setError('Password is required');
        return;
      }
      setLoading(true);
      try {
        await login(e, password);
        handleClose();
        onSuccess();
      } catch (err: unknown) {
        setError((err as Error)?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signup') {
      if (!password) {
        setError('Password is required');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        await register(e, password);
        handleClose();
        onSuccess();
      } catch (err: unknown) {
        setError((err as Error)?.message || 'Sign up failed');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        await forgotPassword(e);
        setCodeSent(true);
        setMode('reset');
      } catch {
        setError('Failed to send reset code');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'reset') {
      if (!code || !newPassword) {
        setError('Code and new password are required');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      setLoading(true);
      try {
        await resetPassword(e, code, newPassword);
        handleClose();
        onSuccess();
      } catch (err: unknown) {
        setError((err as Error)?.message || 'Reset failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {mode === 'login' && 'Log in'}
              {mode === 'signup' && 'Sign up'}
              {mode === 'forgot' && 'Forgot password'}
              {mode === 'reset' && 'Reset password'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="hello@happypause.com"
              placeholderTextColor="rgba(181,183,162,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={mode !== 'reset' || !codeSent}
            />
          </View>

          {mode !== 'forgot' && mode !== 'reset' && (
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(181,183,162,0.5)"
                  secureTextEntry={!showPassword}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.visibilityBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.zenAccent}
                  />
                </TouchableOpacity>
              </View>
              {mode === 'login' && (
                <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotBtn}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(181,183,162,0.5)"
                secureTextEntry
                style={styles.input}
              />
            </View>
          )}

          {mode === 'reset' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Reset code (from email)</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor="rgba(181,183,162,0.5)"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(181,183,162,0.5)"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={styles.primaryBtn}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.charcoal} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'login' && 'Log in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send code'}
                {mode === 'reset' && 'Reset password'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            {mode === 'login' && (
              <>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
                <View style={styles.footerSpacer} />
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'signup' && (
              <>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.linkText}>Log In</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={styles.linkText}>Back to login</Text>
              </TouchableOpacity>
            )}
            {mode === 'reset' && (
              <TouchableOpacity
                onPress={() => {
                  setMode('forgot');
                  setCodeSent(false);
                  setCode('');
                  setNewPassword('');
                }}
              >
                <Text style={styles.linkText}>Request new code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.zenAccent,
    fontFamily: FONTS.medium,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  headerSpacer: {
    width: 60,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.zenAccent,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: FONTS.semibold,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.zenText,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  visibilityBtn: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primarySage,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
    fontFamily: FONTS.bold,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.zenAccent,
    fontFamily: FONTS.regular,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.vibrantGreen,
    fontFamily: FONTS.semibold,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.vibrantGreen,
    fontFamily: FONTS.bold,
  },
});
