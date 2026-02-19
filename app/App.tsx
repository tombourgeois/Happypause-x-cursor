import './global.css';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import TimerTab from './screens/TimerTab';
import StatsTab from './screens/StatsTab';
import HistoryTab from './screens/HistoryTab';
import ProfileTab from './screens/ProfileTab';
import SettingsModal from './screens/SettingsModal';
import CreateActivityModal from './screens/CreateActivityModal';
import LoginScreen from './screens/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getSettings } from './services/settingsService';
import type { UserSettings } from './types';

const Tab = createBottomTabNavigator();

const DEFAULT_SETTINGS: UserSettings = {
  focusDuration: 55,
  pauseDuration: 5,
  visibleCategories: ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'],
  ringtone: 'Default',
  language: 'EN',
};

function AppContent() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { isLoading: authLoading, hasCompletedAuth, login, register, forgotPassword, resetPassword, continueAsGuest } =
    useAuth();

  useEffect(() => {
    if (!hasCompletedAuth || authLoading) return;
    getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, [authLoading, hasCompletedAuth]);

  if (authLoading) {
    return (
      <View className="flex-1 bg-charcoal items-center justify-center">
        <ActivityIndicator size="large" color="#b1b7a2" />
      </View>
    );
  }

  if (!hasCompletedAuth) {
    return (
      <>
        <LoginScreen
          login={login}
          register={register}
          forgotPassword={forgotPassword}
          resetPassword={resetPassword}
          continueAsGuest={continueAsGuest}
        />
        <StatusBar style="light" />
      </>
    );
  }

  if (!settingsLoaded) {
    return (
      <View className="flex-1 bg-charcoal items-center justify-center">
        <ActivityIndicator size="large" color="#b1b7a2" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: '#36333a', borderTopColor: '#555' },
            tabBarActiveTintColor: '#b1b7a2',
            tabBarInactiveTintColor: '#888',
          }}
        >
          <Tab.Screen
            name="Timer"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="timer-outline" size={size} color={color} />
              ),
            }}
          >
            {() => (
              <TimerTab
                settings={settings}
                openSettings={() => setShowSettings(true)}
                openCreateActivity={() => setShowCreate(true)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Stats"
            component={StatsTab}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryTab}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="time-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          >
            {() => <ProfileTab openSettings={() => setShowSettings(true)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={setSettings}
      />
      <CreateActivityModal visible={showCreate} onClose={() => setShowCreate(false)} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
