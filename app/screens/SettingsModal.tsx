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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, saveSettings } from '../services/settingsService';
import { COLORS, FONTS } from '../theme';
import type { UserSettings } from '../types';

const CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

const RINGTONES = [
  { id: 'Default', label: 'Zen Chime (Default)' },
  { id: 'Forest', label: 'Forest Morning' },
  { id: 'Digital', label: 'Digital Pulse' },
  { id: 'Crystal', label: 'Crystal Bowl' },
  { id: 'Ocean', label: 'Ocean Waves' },
];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  FITNESS: 'fitness-outline',
  LEISURE: 'leaf-outline',
  SOCIAL: 'people-outline',
  MIND: 'bulb-outline',
  SPIRITUAL: 'sparkles-outline',
  RELAXATION: 'bed-outline',
};

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
        <View style={[styles.overlay, styles.centered]}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primarySage} />
          ) : (
            <Text style={styles.errorText}>Cannot load settings</Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.blurCircle, styles.blurBottom]} pointerEvents="none" />
        <View style={[styles.blurCircle, styles.blurTop]} pointerEvents="none" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back-ios" size={22} color={COLORS.primarySage} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.primarySage} />
              <Text style={styles.sectionLabel}>Ringtone</Text>
            </View>
            <View style={styles.ringtoneList}>
              {RINGTONES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setSettings({ ...settings, ringtone: r.id })}
                  style={[
                    styles.ringtoneOption,
                    (settings.ringtone === r.id || (r.id === 'Default' && !settings.ringtone)) && styles.ringtoneOptionActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.ringtoneLabel,
                    (settings.ringtone === r.id || (r.id === 'Default' && !settings.ringtone)) && styles.ringtoneLabelActive,
                  ]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid-outline" size={20} color={COLORS.primarySage} />
              <Text style={styles.sectionLabel}>Visible Categories</Text>
            </View>
            <View style={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={styles.categoryRow}
                  activeOpacity={0.8}
                >
                  <View style={styles.categoryLeft}>
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={CATEGORY_ICONS[cat] || 'ellipse-outline'}
                        size={20}
                        color={COLORS.primarySage}
                      />
                    </View>
                    <Text style={styles.categoryName}>{cat}</Text>
                  </View>
                  <Switch
                    value={settings.visibleCategories.includes(cat)}
                    onValueChange={() => toggleCategory(cat)}
                    trackColor={{ false: COLORS.borderDark, true: COLORS.primarySage }}
                    thumbColor={COLORS.zenText}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="timer-outline" size={20} color={COLORS.primarySage} />
              <Text style={styles.sectionLabel}>Focus Session Time</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                value={String(settings.focusDuration)}
                onChangeText={(t) =>
                  setSettings({ ...settings, focusDuration: parseInt(t, 10) || 55 })
                }
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor="rgba(181,183,162,0.5)"
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cafe-outline" size={20} color={COLORS.primarySage} />
              <Text style={styles.sectionLabel}>HappyPause Time</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                value={String(settings.pauseDuration)}
                onChangeText={(t) =>
                  setSettings({ ...settings, pauseDuration: parseInt(t, 10) || 5 })
                }
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor="rgba(181,183,162,0.5)"
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.9}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <Text style={styles.configVersion}>Configuration v1.4.2</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(54,51,58,0.95)',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.zenText,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  closeBtn: {
    marginTop: 16,
  },
  closeBtnText: {
    color: COLORS.primarySage,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,77,84,0.2)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primarySage,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  hint: {
    fontSize: 14,
    color: 'rgba(245,245,245,0.6)',
    fontFamily: FONTS.regular,
  },
  ringtoneList: {
    backgroundColor: COLORS.fieldDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(80,77,84,0.5)',
    overflow: 'hidden',
  },
  ringtoneOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,77,84,0.3)',
  },
  ringtoneOptionActive: {
    backgroundColor: 'rgba(177,183,162,0.1)',
  },
  ringtoneLabel: {
    fontSize: 16,
    color: COLORS.zenText,
    fontFamily: FONTS.regular,
  },
  ringtoneLabelActive: {
    color: COLORS.primarySage,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
  },
  categoryList: {
    backgroundColor: 'rgba(68,65,72,0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(80,77,84,0.3)',
    overflow: 'hidden',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,77,84,0.2)',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: 'rgba(177,183,162,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 16,
    color: COLORS.zenText,
    fontFamily: FONTS.medium,
  },
  inputRow: {
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.fieldDark,
    borderWidth: 1,
    borderColor: 'rgba(80,77,84,0.5)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 48,
    color: COLORS.zenText,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  inputSuffix: {
    position: 'absolute',
    right: 20,
    top: 18,
    fontSize: 16,
    color: COLORS.zenAccent,
    fontFamily: FONTS.medium,
  },
  saveBtn: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primarySage,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: COLORS.primarySage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.charcoal,
    fontFamily: FONTS.bold,
  },
  configVersion: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(177,183,162,0.6)',
    marginTop: 24,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  blurCircle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.05,
  },
  blurTop: {
    top: -96,
    left: -96,
    width: 320,
    height: 320,
    backgroundColor: COLORS.primarySage,
  },
  blurBottom: {
    bottom: -96,
    right: -96,
    width: 320,
    height: 320,
    backgroundColor: COLORS.primarySage,
  },
});
