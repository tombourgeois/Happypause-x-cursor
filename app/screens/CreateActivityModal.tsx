import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { createActivity } from '../services/activityService';

const CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

interface CreateActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateActivityModal({ visible, onClose }: CreateActivityModalProps) {
  const [category, setCategory] = useState('FITNESS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [infoUrl, setInfoUrl] = useState('');
  const [makePublic, setMakePublic] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Name and description are required.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service.');
      return;
    }
    setSaving(true);
    try {
      await createActivity({
        category,
        title: title.trim(),
        description: description.trim(),
        info_url: infoUrl.trim() || undefined,
        is_public: makePublic,
      });
      Alert.alert('Success', 'Activity created!');
      setTitle('');
      setDescription('');
      setInfoUrl('');
      onClose();
    } catch {
      Alert.alert('Error', 'Cannot connect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-charcoal">
        <View className="flex-row justify-between items-center p-6 pt-12">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-sage text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-offWhite text-xl font-bold">Create HappyPause</Text>
          <View style={{ width: 50 }} />
        </View>
        <ScrollView className="flex-1 px-6">
          <Text className="text-offWhite/70 text-sm mt-4">Category</Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                className={`px-4 py-2 rounded-full ${
                  category === c ? 'bg-sage' : 'bg-offWhite/10'
                }`}
              >
                <Text
                  className={category === c ? 'text-charcoal font-bold' : 'text-offWhite'}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-offWhite/70 text-sm mt-4">Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Activity name"
            placeholderTextColor="#888"
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mt-2"
          />
          <Text className="text-offWhite/70 text-sm mt-4">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the activity"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mt-2 min-h-[100px]"
          />
          <Text className="text-offWhite/70 text-sm mt-4">Info URL (optional)</Text>
          <TextInput
            value={infoUrl}
            onChangeText={setInfoUrl}
            placeholder="https://..."
            placeholderTextColor="#888"
            keyboardType="url"
            className="bg-offWhite/10 text-offWhite rounded-lg px-4 py-3 mt-2"
          />
          <TouchableOpacity
            onPress={() => setMakePublic(!makePublic)}
            className="flex-row items-center mt-6"
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 ${
                makePublic ? 'bg-sage border-sage' : 'border-offWhite/50'
              }`}
            />
            <Text className="text-offWhite">Make this public</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setAgreeTerms(!agreeTerms)}
            className="flex-row items-center mt-4"
          >
            <View
              className={`w-6 h-6 rounded border-2 mr-3 ${
                agreeTerms ? 'bg-sage border-sage' : 'border-offWhite/50'
              }`}
            />
            <Text className="text-offWhite flex-1">
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className="bg-sage rounded-xl py-4 mt-8 mb-8"
          >
            <Text className="text-charcoal font-bold text-center">
              {saving ? 'Saving...' : 'Add & Submit'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
