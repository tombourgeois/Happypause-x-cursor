import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createActivity } from '../services/activityService';
import { COLORS, FONTS } from '../theme';

const CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];
const SUGGEST_NEW = 'Suggest new';

interface CreateActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateActivityModal({ visible, onClose }: CreateActivityModalProps) {
  const [category, setCategory] = useState('FITNESS');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [infoUrl, setInfoUrl] = useState('');
  const [makePublic, setMakePublic] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveCategory = category === SUGGEST_NEW ? customCategory.trim().toUpperCase() || 'OTHER' : category;

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Name and description are required.');
      return;
    }
    if (category === SUGGEST_NEW && !customCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name for "Suggest new".');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service.');
      return;
    }
    setSaving(true);
    try {
      await createActivity({
        category: effectiveCategory,
        title: title.trim(),
        description: description.trim(),
        info_url: infoUrl.trim() || undefined,
        is_public: makePublic,
      });
      if (makePublic) {
        const body = `Category: ${effectiveCategory}\nTitle: ${title.trim()}\nDescription: ${description.trim()}\nInfo URL: ${infoUrl.trim() || 'N/A'}`;
        const mailto = `mailto:Poutineman@gmail.com?subject=Add new HappyPause&body=${encodeURIComponent(body)}`;
        Linking.openURL(mailto);
      }
      Alert.alert('Success', 'Activity created!');
      setTitle('');
      setDescription('');
      setInfoUrl('');
      setCategory('FITNESS');
      setCustomCategory('');
      onClose();
    } catch {
      Alert.alert('Error', 'Cannot connect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.blurCircle, styles.blurTop]} pointerEvents="none" />
        <View style={[styles.blurCircle, styles.blurBottom]} pointerEvents="none" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back-ios" size={22} color={COLORS.primarySage} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a HappyPause</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {[...CATEGORIES, SUGGEST_NEW].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.categoryChip,
                    category === c && styles.categoryChipActive,
                  ]}
                  activeOpacity={0.9}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === c && styles.categoryChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {category === SUGGEST_NEW && (
              <TextInput
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder="Enter new category name"
                placeholderTextColor="rgba(245,245,245,0.3)"
                style={[styles.input, styles.customCategoryInput]}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>HappyPause Name</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Morning Zen Flow"
              placeholderTextColor="rgba(245,245,245,0.3)"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>HappyPause Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What will you do during this break? Describe your ritual..."
              placeholderTextColor="rgba(245,245,245,0.3)"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Additional Info Link</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="link-outline"
                size={20}
                color="rgba(245,245,245,0.3)"
                style={styles.inputIcon}
              />
              <TextInput
                value={infoUrl}
                onChangeText={setInfoUrl}
                placeholder="https://example.com/guide"
                placeholderTextColor="rgba(245,245,245,0.3)"
                keyboardType="url"
                style={[styles.input, styles.inputWithPadding]}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setMakePublic(!makePublic)}
            style={styles.checkRow}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, makePublic && styles.checkboxActive]}>
              {makePublic && (
                <Ionicons name="checkmark" size={14} color={COLORS.charcoal} />
              )}
            </View>
            <Text style={styles.checkLabel}>
              I want to make this HappyPause public for the community
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={styles.checkRow}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms && (
                <Ionicons name="checkmark" size={14} color={COLORS.charcoal} />
              )}
            </View>
            <Text style={styles.checkLabel}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={styles.submitBtn}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.charcoal} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Add & Submit</Text>
                <Ionicons name="rocket" size={20} color={COLORS.charcoal} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(177,183,162,0.2)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: 'rgba(177,183,162,0.1)',
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
    paddingVertical: 32,
    paddingBottom: 48,
  },
  field: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.primarySage,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: FONTS.semibold,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(177,183,162,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(177,183,162,0.3)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primarySage,
    borderColor: COLORS.primarySage,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.zenText,
    fontFamily: FONTS.medium,
  },
  categoryChipTextActive: {
    color: COLORS.charcoal,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(177,183,162,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(177,183,162,0.3)',
    borderRadius: 12,
    paddingHorizontal: 20,
    color: COLORS.zenText,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  customCategoryInput: {
    marginTop: 12,
  },
  inputWithIcon: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  inputWithPadding: {
    paddingLeft: 48,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(177,183,162,0.4)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primarySage,
    borderColor: COLORS.primarySage,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(245,245,245,0.7)',
    fontFamily: FONTS.medium,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 64,
    backgroundColor: COLORS.primarySage,
    borderRadius: 12,
    marginTop: 32,
    marginBottom: 48,
    shadowColor: COLORS.primarySage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.charcoal,
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
