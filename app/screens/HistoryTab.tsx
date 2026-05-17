import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLogs } from '../services/logService';
import { COLORS, FONTS } from '../theme';
import type { LogEntry } from '../types';

interface HistoryTabProps {
  openSettings?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  focus_started: 'Focus started',
  focus_paused: 'Focus paused',
  focus_stopped: 'Focus stopped',
  focus_resumed: 'Focus resumed',
  focus_restarted: 'Focus restarted',
  happypause_started: 'Pause started',
  happypause_done: 'Pause done',
  happypause_skipped: 'Pause skipped',
  happypause_cycled: 'Activity cycled',
  happypause_thumb_up: 'Thumbs up',
  happypause_thumb_down: 'Thumbs down',
  happypause_created: 'Activity created',
};

const getIconForType = (type: string) => {
  if (type.includes('focus_stopped')) return { name: 'stop-circle' as const, color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
  if (type.includes('happypause_thumb_up')) return { name: 'heart' as const, color: '#f472b6', bg: 'rgba(244,114,182,0.1)' };
  if (type.includes('happypause_done')) return { name: 'checkmark-circle' as const, color: COLORS.primarySage, bg: 'rgba(177,183,162,0.2)' };
  if (type.includes('focus_started')) return { name: 'play' as const, color: COLORS.primarySage, bg: 'rgba(177,183,162,0.1)' };
  if (type.includes('happypause_skipped')) return { name: 'play-forward' as const, color: 'rgba(245,245,245,0.4)', bg: 'rgba(245,245,245,0.05)' };
  if (type.includes('happypause_created')) return { name: 'add-circle' as const, color: COLORS.primarySage, bg: 'rgba(177,183,162,0.1)' };
  if (type.includes('focus_restarted')) return { name: 'refresh' as const, color: COLORS.primarySage, bg: 'rgba(177,183,162,0.1)' };
  return { name: 'ellipse' as const, color: 'rgba(245,245,245,0.4)', bg: 'rgba(245,245,245,0.05)' };
};

export default function HistoryTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const l = await getLogs();
      setLogs(l);
    } catch {
      setError('Cannot connect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && logs.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primarySage} />
      </View>
    );
  }

  if (error && logs.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const groupByDate = (entries: LogEntry[]) => {
    const groups: Record<string, LogEntry[]> = {};
    entries.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  };

  const groups = groupByDate(logs);
  const sortedDates = Object.keys(groups).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.primarySage} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="leaf" size={14} color={COLORS.charcoal} />
          </View>
          <Text style={styles.headerTitle}>HappyPause</Text>
        </View>
        {openSettings && (
          <TouchableOpacity
            onPress={openSettings}
            style={styles.settingsBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.zenText} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Activity History</Text>
      </View>
      <View style={styles.content}>
        {sortedDates.map((date) => (
          <View key={date} style={styles.section}>
            <Text style={styles.sectionLabel}>{date}</Text>
            {groups[date].map((log, idx) => {
              const icon = getIconForType(log.type);
              const isLast = idx === groups[date].length - 1;
              return (
                <View key={log.id} style={styles.entry}>
                  <View style={styles.entryIcon}>
                    <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name} size={20} color={icon.color} />
                    </View>
                    {!isLast && <View style={styles.timeline} />}
                  </View>
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>
                      {TYPE_LABELS[log.type] || log.type}
                    </Text>
                    {log.activityName && (
                      <Text style={styles.entrySub}>
                        {log.activityName}
                      </Text>
                    )}
                    <Text style={styles.entryTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONTS.bold,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 96,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.primarySage,
    opacity: 0.8,
    marginBottom: 24,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  entry: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  entryIcon: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    width: 1,
    flex: 1,
    backgroundColor: 'rgba(177,183,162,0.1)',
    marginTop: 8,
  },
  entryContent: {
    flex: 1,
    paddingTop: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONTS.medium,
  },
  entrySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  entryTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
});
