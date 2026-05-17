import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

interface LoginScreenProps {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  continueAsGuest: () => void;
}

export default function LoginScreen({
  login,
  register,
  forgotPassword,
  resetPassword,
  continueAsGuest,
}: LoginScreenProps) {
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
      } catch (err: unknown) {
        setError((err as Error)?.message || 'Reset failed');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={40} color={COLORS.charcoal} />
          </View>
          <Text style={styles.title}>HappyPause</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' && 'Take a pause. Be happy.'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Enter your reset code'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={mode === 'login' ? 'hello@happypause.com' : 'you@example.com'}
              placeholderTextColor="rgba(181, 183, 162, 0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={mode !== 'reset' || !codeSent}
            />
          </View>

          {mode !== 'forgot' && mode !== 'reset' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(181, 183, 162, 0.5)"
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
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {mode === 'signup' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="rgba(181, 183, 162, 0.5)"
                secureTextEntry
                style={styles.input}
              />
            </View>
          )}

          {mode === 'reset' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Reset code (from email)</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  placeholderTextColor="rgba(181, 183, 162, 0.5)"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(181, 183, 162, 0.5)"
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
                {mode === 'login' && 'Login'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send code'}
                {mode === 'reset' && 'Reset password'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'login' && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9}>
                  <Ionicons name="logo-google" size={20} color="#3c4043" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.appleBtn} activeOpacity={0.9}>
                  <Ionicons name="logo-apple" size={22} color="#fff" />
                  <Text style={styles.appleBtnText}>Continue with Apple</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <View style={styles.footerRow}>
            {mode === 'login' && (
              <>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'signup' && (
              <>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.signUpLink}>Log in</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={styles.signUpLink}>Back to login</Text>
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
                <Text style={styles.signUpLink}>Request new code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={continueAsGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Decorative blurs */}
      <View style={[styles.blurCircle, styles.blurTop]} pointerEvents="none" />
      <View style={[styles.blurCircle, styles.blurBottom]} pointerEvents="none" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
    minHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: 12,
  },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.zenText,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.zenAccent,
    fontFamily: 'Manrope_500Medium',
  },
  form: {
    flex: 1,
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.zenAccent,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.vibrantGreen,
    fontFamily: FONTS.semibold,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primarySage,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
    letterSpacing: 0.5,
    fontFamily: FONTS.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(181, 183, 162, 0.2)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(181, 183, 162, 0.6)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  socialButtons: {
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3c4043',
    fontFamily: 'Manrope_500Medium',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  appleBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  footer: {
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(181, 183, 162, 0.1)',
    marginBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.zenAccent,
    fontFamily: FONTS.regular,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.vibrantGreen,
    fontFamily: FONTS.bold,
  },
  guestBtn: {
    paddingVertical: 12,
    alignSelf: 'center',
  },
  guestText: {
    fontSize: 14,
    color: 'rgba(181, 183, 162, 0.6)',
    fontFamily: FONTS.regular,
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.05,
  },
  blurTop: {
    top: '-10%',
    left: '-10%',
    width: 256,
    height: 256,
    backgroundColor: COLORS.primarySage,
  },
  blurBottom: {
    bottom: '-5%',
    right: '-5%',
    width: 320,
    height: 320,
    backgroundColor: COLORS.vibrantGreen,
  },
});
