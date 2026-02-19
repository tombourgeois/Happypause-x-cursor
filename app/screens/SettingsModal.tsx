import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { getSettings, saveSettings } from '../services/settingsService';
import type { UserSettings } from '../types';

const CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (s: UserSettings) => void;
}

export default function SettingsModal({ visible, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      getSettings()
        .then(setSettings)
        .catch(() => setSettings(null))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleSave = async () => {
    if (!settings) return;
    try {
      await saveSettings(settings);
      onSave(settings);
      onClose();
    } catch {
      // show error
    }
  };

  const toggleCategory = (cat: string) => {
    if (!settings) return;
    const next = settings.visibleCategories.includes(cat)
      ? settings.visibleCategories.filter((c) => c !== cat)
      : [...settings.visibleCategories, cat];
    setSettings({ ...settings, visibleCategories: next });
  };

  if (!settings) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View className="flex-1 bg-charcoal/95 justify-center items-center">
          {loading ? (
            <ActivityIndicator size="large" color="#b1b7a2" />
          ) : (
            <Text className="text-offWhite">Cannot load settings</Text>
          )}
          <TouchableOpacity onPress={onClose} className="mt-4">
            <Text className="text-sage">Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-charcoal/95">
        <View className="flex-row justify-between items-center p-6 pt-12">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-sage text-lg">Back</Text>
          </TouchableOpacity>
          <Text className="text-offWhite text-xl font-bold">Settings</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView className="flex-1 px-6">
          <Text className="text-offWhite/70 text-sm uppercase mt-4">Focus duration (min)</Text>
          <TextInput
            value={String(settings.focusDuration)}
            onChangeText={(t) => setSettings({ ...settings, focusDuration: parseInt(t, 10) || 55 })}
            keyboardType="number-pad"
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mt-2"
          />
          <Text className="text-offWhite/70 text-sm uppercase mt-4">Pause duration (min)</Text>
          <TextInput
            value={String(settings.pauseDuration)}
            onChangeText={(t) => setSettings({ ...settings, pauseDuration: parseInt(t, 10) || 5 })}
            keyboardType="number-pad"
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mt-2"
          />
          <Text className="text-offWhite/70 text-sm uppercase mt-6">Categories</Text>
          {CATEGORIES.map((cat) => (
            <View key={cat} className="flex-row justify-between items-center py-3">
              <Text className="text-offWhite">{cat}</Text>
              <Switch
                value={settings.visibleCategories.includes(cat)}
                onValueChange={() => toggleCategory(cat)}
                trackColor={{ false: '#555', true: '#b1b7a2' }}
                thumbColor="#f5f5f5"
              />
            </View>
          ))}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-sage rounded-xl py-4 mt-8 mb-8"
          >
            <Text className="text-charcoal font-bold text-center">Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
