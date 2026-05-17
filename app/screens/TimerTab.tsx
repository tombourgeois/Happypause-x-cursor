import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CircularTimer from '../components/CircularTimer';
import * as activityService from '../services/activityService';
import * as logService from '../services/logService';
import { getImageUrl } from '../services/api';
import { COLORS, FONTS } from '../theme';
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
      setActivity({
        ...activity,
        thumbsUpCount: Math.min(10, (activity.thumbsUpCount ?? 0) + 1),
      });
    }
  };

  const handleThumbDown = () => {
    if (activity) {
      activityService.updateFeedback(activity.id, 'increment_down');
      logService.addLog({ type: 'happypause_thumb_down', activityId: activity.id });
      setActivity({
        ...activity,
        thumbsDownCount: Math.min(10, (activity.thumbsDownCount ?? 0) + 1),
      });
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={20} color={COLORS.charcoal} />
          </View>
          <Text style={styles.headerTitle}>HappyPause</Text>
        </View>
        <TouchableOpacity onPress={openSettings} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color="rgba(245,245,245,0.6)" />
        </TouchableOpacity>
      </View>

      {mode === 'focus' && (
        <View style={styles.main}>
          <View style={styles.timerSection}>
            <CircularTimer progress={progress}>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>Focus Session</Text>
              </View>
              <Text style={styles.endsAt}>Ends at {endTime}</Text>
              <Text style={styles.timeDisplay}>{formatTime(timeLeft)}</Text>
              <Text style={styles.untilBreak}>Until break</Text>
              <TouchableOpacity
                onPress={handleHavePause}
                style={styles.havePauseBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="play" size={18} color={COLORS.charcoal} />
                <Text style={styles.havePauseText}>Have a HappyPause</Text>
              </TouchableOpacity>
            </CircularTimer>
            <View style={styles.controls}>
              <TouchableOpacity
                onPress={() => setState('idle')}
                style={styles.controlBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="stop" size={24} color="rgba(245,245,245,0.8)" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setState(state === 'running' ? 'paused' : 'running')}
                style={[styles.controlBtn, styles.controlBtnPrimary]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={state === 'running' ? 'pause' : 'play'}
                  size={32}
                  color={COLORS.charcoal}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTimeLeft(settings.focusDuration * 60);
                  setState('running');
                }}
                style={styles.controlBtn}
                activeOpacity={0.9}
              >
                <Ionicons name="refresh" size={24} color="rgba(245,245,245,0.8)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {mode === 'pause' && (
        <View style={styles.main}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primarySage} />
          ) : activity ? (
            <View style={styles.pauseSection}>
              <View style={styles.pauseHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setMode('focus');
                    setState('idle');
                    setTimeLeft(settings.focusDuration * 60);
                    setActivity(null);
                  }}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={24} color={COLORS.primarySage} />
                </TouchableOpacity>
                <Text style={styles.pauseTitle}>HAPPYPAUSE IN PROGRESS</Text>
                <View style={styles.closeBtn} />
              </View>
              <TouchableOpacity
                onPress={openInfo}
                activeOpacity={1}
                style={styles.circleTouchable}
              >
              <CircularTimer progress={progress}>
                <Text style={styles.categoryLabel}>{activity.category}</Text>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.iconName && !imageError ? (
                  <Image
                    source={{ uri: getImageUrl(activity.iconName) }}
                    style={styles.activityIcon}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.activityIconPlaceholder}>
                    <Ionicons name="fitness-outline" size={48} color={COLORS.primarySage} />
                  </View>
                )}
                <Text style={styles.activityDesc} numberOfLines={3}>
                  {activity.description}
                </Text>
                <Text style={styles.timeDisplay}>{formatTime(timeLeft)}</Text>
                <Text style={styles.remainingLabel}>Remaining</Text>
                <Text style={styles.pressToKnowMore}>press to know more</Text>
              </CircularTimer>
              </TouchableOpacity>
              <View style={styles.pauseActions}>
                <TouchableOpacity
                  onPress={handleCycle}
                  style={styles.pauseActionBtn}
                  activeOpacity={0.9}
                >
                  <Ionicons name="refresh" size={28} color="rgba(245,245,245,0.6)" />
                  <Text style={styles.pauseActionLabel}>Cycle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDone}
                  style={[styles.pauseActionBtn, styles.pauseActionBtnPrimary]}
                  activeOpacity={0.9}
                >
                  <Ionicons name="checkmark" size={32} color={COLORS.charcoal} />
                  <Text style={[styles.pauseActionLabel, styles.pauseActionLabelPrimary]}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.pauseActionBtn}
                  activeOpacity={0.9}
                >
                  <Ionicons name="play-forward" size={28} color="rgba(245,245,245,0.6)" />
                  <Text style={styles.pauseActionLabel}>Skip</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.thumbsRow}>
                <View style={styles.thumbBtn}>
                  <TouchableOpacity onPress={handleThumbDown} style={styles.thumbBtnInner}>
                    <Ionicons
                      name={(activity.thumbsDownCount ?? 0) > 0 ? 'thumbs-down' : 'thumbs-down-outline'}
                      size={24}
                      color={(activity.thumbsDownCount ?? 0) > 0 ? '#f87171' : 'rgba(245,245,245,0.3)'}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.thumbCount, (activity.thumbsDownCount ?? 0) > 0 && styles.thumbCountDown]}>
                    {activity.thumbsDownCount ?? 0}
                  </Text>
                </View>
                <TouchableOpacity onPress={openInfo}>
                  <Text style={styles.learnMoreText}>Learn more</Text>
                </TouchableOpacity>
                <View style={styles.thumbBtn}>
                  <TouchableOpacity onPress={handleThumbUp} style={styles.thumbBtnInner}>
                    <Ionicons
                      name={(activity.thumbsUpCount ?? 0) > 0 ? 'thumbs-up' : 'thumbs-up-outline'}
                      size={24}
                      color={(activity.thumbsUpCount ?? 0) > 0 ? COLORS.primarySage : 'rgba(245,245,245,0.3)'}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.thumbCount, (activity.thumbsUpCount ?? 0) > 0 && styles.thumbCountUp]}>
                    {activity.thumbsUpCount ?? 0}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={openCreateActivity} style={styles.createPauseLink}>
                <Text style={styles.createPauseLinkText}>Create a HappyPause</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noActivities}>No activities available</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: 'rgba(245,245,245,0.9)',
    fontFamily: FONTS.bold,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timerSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  focusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(177,183,162,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(177,183,162,0.2)',
    marginBottom: 4,
  },
  focusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primarySage,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  endsAt: {
    fontSize: 11,
    color: 'rgba(245,245,245,0.4)',
    marginBottom: 16,
    fontFamily: FONTS.medium,
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  untilBreak: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(245,245,245,0.4)',
    marginTop: 12,
    marginBottom: 24,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  havePauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,245,245,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  havePauseText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginTop: 48,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.1)',
    backgroundColor: 'rgba(245,245,245,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPrimary: {
    width: 80,
    height: 80,
    borderWidth: 0,
    backgroundColor: COLORS.primarySage,
    shadowColor: COLORS.primarySage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  pauseSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: COLORS.primarySage,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.zenText,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  activityIcon: {
    width: 80,
    height: 80,
    marginTop: 12,
    borderRadius: 8,
  },
  activityIconPlaceholder: {
    width: 80,
    height: 80,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(245,245,245,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDesc: {
    fontSize: 12,
    color: 'rgba(245,245,245,0.6)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 24,
    fontFamily: FONTS.medium,
  },
  remainingLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(245,245,245,0.4)',
    textTransform: 'uppercase',
    marginTop: 6,
    fontFamily: FONTS.bold,
  },
  pauseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginTop: 24,
  },
  pauseActionBtn: {
    alignItems: 'center',
    gap: 12,
  },
  pauseActionBtnPrimary: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    backgroundColor: COLORS.primarySage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primarySage,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  pauseActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(245,245,245,0.3)',
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  pauseActionLabelPrimary: {
    color: COLORS.primarySage,
  },
  pauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  circleTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressToKnowMore: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(245,245,245,0.3)',
    textTransform: 'uppercase',
    marginTop: 8,
    fontFamily: FONTS.bold,
  },
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
  },
  thumbBtn: {
    alignItems: 'center',
    gap: 4,
  },
  thumbBtnInner: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    backgroundColor: 'rgba(245,245,245,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(245,245,245,0.3)',
    fontFamily: FONTS.bold,
  },
  thumbCountUp: {
    color: COLORS.primarySage,
  },
  thumbCountDown: {
    color: '#f87171',
  },
  learnMoreText: {
    fontSize: 14,
    color: COLORS.primarySage,
    fontFamily: FONTS.medium,
  },
  createPauseLink: {
    marginTop: 24,
  },
  createPauseLinkText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.primarySage,
    fontFamily: FONTS.bold,
  },
  noActivities: {
    fontSize: 16,
    color: COLORS.zenText,
    fontFamily: FONTS.regular,
  },
});
