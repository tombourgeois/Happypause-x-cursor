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
} from 'react-native';

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
        className="flex-1 bg-charcoal/98 justify-center"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-sage text-lg" onPress={handleClose}>
              Cancel
            </Text>
            <Text className="text-offWhite text-xl font-bold">
              {mode === 'login' && 'Log in'}
              {mode === 'signup' && 'Sign up'}
              {mode === 'forgot' && 'Forgot password'}
              {mode === 'reset' && 'Reset password'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {error ? (
            <View className="bg-red-500/20 rounded-lg p-3 mb-4">
              <Text className="text-red-400">{error}</Text>
            </View>
          ) : null}

          <Text className="text-offWhite/70 text-sm mb-2">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mb-4"
            editable={mode !== 'reset' || !codeSent}
          />

          {mode !== 'forgot' && mode !== 'reset' && (
            <>
              <Text className="text-offWhite/70 text-sm mb-2">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry
                className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mb-4"
              />
            </>
          )}

          {mode === 'signup' && (
            <>
              <Text className="text-offWhite/70 text-sm mb-2">Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry
                className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mb-4"
              />
            </>
          )}

          {mode === 'reset' && (
            <>
              <Text className="text-offWhite/70 text-sm mb-2">Reset code (from email)</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={6}
                className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mb-4"
              />
              <Text className="text-offWhite/70 text-sm mb-2">New password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry
                className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mb-4"
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-sage rounded-xl py-4 mt-4"
          >
            {loading ? (
              <ActivityIndicator color="#36333a" />
            ) : (
              <Text className="text-charcoal font-bold text-center">
                {mode === 'login' && 'Log in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send code'}
                {mode === 'reset' && 'Reset password'}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center gap-4 mt-6">
            {mode === 'login' && (
              <>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text className="text-sage">Sign up</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text className="text-sage">Forgot password?</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'signup' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text className="text-sage">Already have an account? Log in</Text>
              </TouchableOpacity>
            )}
            {mode === 'forgot' && (
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text className="text-sage">Back to login</Text>
              </TouchableOpacity>
            )}
            {mode === 'reset' && (
              <TouchableOpacity onPress={() => { setMode('forgot'); setCodeSent(false); setCode(''); setNewPassword(''); }}>
                <Text className="text-sage">Request new code</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
