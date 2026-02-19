import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CircularTimer from '../components/CircularTimer';
import * as activityService from '../services/activityService';
import * as logService from '../services/logService';
import { getImageUrl } from '../services/api';
import type { Activity, UserSettings } from '../types';

const CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

interface TimerTabProps {
  settings: UserSettings;
  openSettings: () => void;
  openCreateActivity: () => void;
}

export default function TimerTab({ settings, openSettings, openCreateActivity }: TimerTabProps) {
  const [mode, setMode] = useState<'focus' | 'pause'>('focus');
  const [state, setState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [activity?.id]);

  const totalSeconds = mode === 'focus' ? settings.focusDuration * 60 : settings.pauseDuration * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 100;

  const tick = useCallback(() => {
    setTimeLeft((p) => {
      if (p <= 1) return 0;
      return p - 1;
    });
  }, []);

  useEffect(() => {
    if (state === 'running') {
      timerRef.current = setInterval(tick, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, tick]);

  useEffect(() => {
    if (timeLeft === 0 && state === 'running') {
      if (mode === 'focus') {
        logService.addLog({ type: 'focus_stopped', duration: settings.focusDuration * 60 });
        startBreak();
      } else {
        logService.addLog({
          type: 'happypause_done',
          activityId: activity?.id,
          activityName: activity?.title,
          category: activity?.category,
        });
        activityService.updateFeedback(activity!.id, 'shown');
        setMode('focus');
        setState('idle');
        setTimeLeft(settings.focusDuration * 60);
        setActivity(null);
      }
    }
  }, [timeLeft, state, mode]);

  const startBreak = async () => {
    setLoading(true);
    try {
      const next = await activityService.getNextActivity(settings);
      setActivity(next || null);
      setMode('pause');
      setTimeLeft(settings.pauseDuration * 60);
      setState('running');
      if (next) {
        logService.addLog({
          type: 'happypause_started',
          activityId: next.id,
          activityName: next.title,
          category: next.category,
        });
      }
    } catch (e) {
      Alert.alert('Cannot connect', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHavePause = () => {
    if (state === 'running') return;
    setState('running');
    startBreak();
  };

  const handleCycle = async () => {
    if (!activity) return;
    logService.addLog({ type: 'happypause_cycled', activityId: activity.id });
    setLoading(true);
    try {
      const next = await activityService.getNextActivity(settings);
      setActivity(next || null);
      setTimeLeft(settings.pauseDuration * 60);
      if (next) {
        logService.addLog({
          type: 'happypause_started',
          activityId: next.id,
          activityName: next.title,
          category: next.category,
        });
      }
    } catch {
      Alert.alert('Cannot connect', 'Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    if (activity) {
      logService.addLog({
        type: 'happypause_done',
        activityId: activity.id,
        activityName: activity.title,
        category: activity.category,
      });
      activityService.updateFeedback(activity.id, 'shown');
    }
    setMode('focus');
    setState('idle');
    setTimeLeft(settings.focusDuration * 60);
    setActivity(null);
  };

  const handleSkip = () => {
    if (activity) {
      logService.addLog({
        type: 'happypause_skipped',
        activityId: activity.id,
        activityName: activity.title,
        category: activity.category,
      });
      activityService.updateFeedback(activity.id, 'shown');
    }
    setMode('focus');
    setState('idle');
    setTimeLeft(settings.focusDuration * 60);
    setActivity(null);
  };

  const handleThumbUp = () => {
    if (activity) {
      activityService.updateFeedback(activity.id, 'increment_up');
      logService.addLog({ type: 'happypause_thumb_up', activityId: activity.id });
    }
  };

  const handleThumbDown = () => {
    if (activity) {
      activityService.updateFeedback(activity.id, 'increment_down');
      logService.addLog({ type: 'happypause_thumb_down', activityId: activity.id });
    }
  };

  const openInfo = () => {
    if (activity?.infoUrl) Linking.openURL(activity.infoUrl);
  };

  const endTime = new Date(Date.now() + timeLeft * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="flex-1 bg-charcoal">
      <View className="flex-row justify-end pt-12 pr-4">
        <TouchableOpacity onPress={openSettings} className="p-2">
          <Ionicons name="settings-outline" size={28} color="#b1b7a2" />
        </TouchableOpacity>
      </View>

      {mode === 'focus' && (
        <View className="flex-1 items-center justify-center px-6">
          <CircularTimer progress={progress}>
            <Text className="text-offWhite/70 text-xs uppercase tracking-wider">Focus Session</Text>
            <Text className="text-offWhite/70 text-xs mt-1">Ends at {endTime}</Text>
            <Text className="text-offWhite text-4xl font-bold mt-2">{formatTime(timeLeft)}</Text>
            <Text className="text-offWhite/70 text-sm mt-1">Until break</Text>
            <TouchableOpacity
              onPress={handleHavePause}
              className="mt-4 bg-sage px-6 py-3 rounded-full"
            >
              <Text className="text-charcoal font-bold">Have a HappyPause</Text>
            </TouchableOpacity>
          </CircularTimer>
          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity
              onPress={() => setState('idle')}
              className="w-12 h-12 rounded-full bg-offWhite/10 items-center justify-center"
            >
              <Ionicons name="stop" size={24} color="#f5f5f5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setState(state === 'running' ? 'paused' : 'running')}
              className="w-12 h-12 rounded-full bg-sage items-center justify-center"
            >
              <Ionicons name={state === 'running' ? 'pause' : 'play'} size={24} color="#36333a" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTimeLeft(settings.focusDuration * 60);
                setState('running');
              }}
              className="w-12 h-12 rounded-full bg-offWhite/10 items-center justify-center"
            >
              <Ionicons name="refresh" size={24} color="#f5f5f5" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'pause' && (
        <View className="flex-1 items-center justify-center px-6">
          {loading ? (
            <ActivityIndicator size="large" color="#b1b7a2" />
          ) : activity ? (
            <>
              <CircularTimer progress={progress}>
                <Text className="text-offWhite/70 text-xs uppercase">{activity.category}</Text>
                <Text className="text-offWhite text-2xl font-bold mt-2 text-center">
                  {activity.title}
                </Text>
                {activity.iconName && !imageError ? (
                  <Image
                    source={{ uri: getImageUrl(activity.iconName) }}
                    style={{ width: 80, height: 80, marginTop: 12, borderRadius: 8 }}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View className="w-20 h-20 mt-3 rounded-lg bg-offWhite/10 items-center justify-center">
                    <Ionicons name="fitness-outline" size={40} color="#b1b7a2" />
                  </View>
                )}
                <Text className="text-offWhite/80 text-sm mt-2 text-center px-4" numberOfLines={3}>
                  {activity.description}
                </Text>
                <Text className="text-offWhite text-3xl font-bold mt-4">{formatTime(timeLeft)}</Text>
              </CircularTimer>
              <View className="flex-row gap-6 mt-6">
                <TouchableOpacity onPress={handleThumbDown}>
                  <Ionicons name="thumbs-down-outline" size={32} color="#f5f5f5" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openInfo}>
                  <Text className="text-sage text-sm">Learn more</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleThumbUp}>
                  <Ionicons name="thumbs-up-outline" size={32} color="#f5f5f5" />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-4 mt-6">
                <TouchableOpacity
                  onPress={handleCycle}
                  className="w-12 h-12 rounded-full bg-offWhite/10 items-center justify-center"
                >
                  <Ionicons name="shuffle" size={24} color="#f5f5f5" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDone}
                  className="w-12 h-12 rounded-full bg-sage items-center justify-center"
                >
                  <Ionicons name="checkmark" size={24} color="#36333a" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSkip}
                  className="w-12 h-12 rounded-full bg-offWhite/10 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#f5f5f5" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={openCreateActivity} className="mt-8">
                <Text className="text-sage text-sm">Create a HappyPause</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text className="text-offWhite">No activities available</Text>
          )}
        </View>
      )}
    </View>
  );
}
