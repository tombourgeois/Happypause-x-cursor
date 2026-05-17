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
import { getStats } from '../services/statsService';
import { COLORS, FONTS } from '../theme';
import type { Stats } from '../types';

interface StatsTabProps {
  openSettings?: () => void;
}

export default function StatsTab({ openSettings }: StatsTabProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      setError('Cannot connect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !stats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primarySage} />
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const focusMinutes = stats?.totalFocusTime ?? 0;
  const pauseMinutes = stats?.totalPauseTime ?? 0;
  const focusFormatted = focusMinutes >= 60
    ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`
    : `${focusMinutes}m`;
  const pauseFormatted = pauseMinutes >= 60
    ? `${Math.floor(pauseMinutes / 60)}h ${pauseMinutes % 60}m`
    : `${pauseMinutes}m`;

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
        <Text style={styles.pageTitle}>Statistics</Text>
      </View>
      <View style={styles.cards}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="timer-outline" size={14} color={COLORS.accentMuted} />
            <Text style={styles.cardLabel}>Focus Time</Text>
          </View>
          <Text style={styles.cardValue}>{focusFormatted}</Text>
          <View style={styles.cardTrend}>
            <Ionicons name="trending-up" size={12} color={COLORS.vibrantGreen} />
            <Text style={styles.cardTrendText}>vs last week</Text>
          </View>
        </View>
        <View style={[styles.card, styles.cardHighlight]}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={14} color={COLORS.primarySage} />
            <Text style={[styles.cardLabel, styles.cardLabelHighlight]}>HappyPause</Text>
          </View>
          <Text style={styles.cardValue}>{pauseFormatted}</Text>
          <View style={styles.cardTrend}>
            <Ionicons name="trending-up" size={12} color={COLORS.vibrantGreen} />
            <Text style={styles.cardTrendText}>vs last week</Text>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly</Text>
        {stats?.weeklyData?.map((d) => (
          <View key={d.date} style={styles.weeklyRow}>
            <Text style={styles.weeklyDate}>{d.date}</Text>
            <Text style={styles.weeklyValue}>
              Focus: {d.focusMinutes}m / Pause: {d.pauseMinutes}m
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Category</Text>
        {stats?.categoryBreakdown &&
          Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
            <View key={cat} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat}</Text>
              <Text style={styles.categoryValue}>{count}</Text>
            </View>
          ))}
      </View>
      {stats?.activityInsight && Object.keys(stats.activityInsight).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Insights</Text>
          {Object.entries(stats.activityInsight).map(([cat, data]) => (
            <View key={cat} style={styles.insightCard}>
              <Text style={styles.insightCategory}>{cat}</Text>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Done</Text>
                <Text style={styles.insightValue}>{data.done ?? 0}</Text>
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>Skipped</Text>
                <Text style={styles.insightValue}>{data.skipped ?? 0}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.zenText,
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
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  cards: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
  },
  cardHighlight: {
    backgroundColor: 'rgba(171,236,19,0.1)',
    borderColor: 'rgba(171,236,19,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.accentMuted,
    textTransform: 'uppercase',
    fontFamily: FONTS.bold,
  },
  cardLabelHighlight: {
    color: COLORS.primarySage,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.zenText,
    fontFamily: FONTS.bold,
  },
  cardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cardTrendText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.vibrantGreen,
    fontFamily: FONTS.bold,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.zenText,
    marginBottom: 24,
    fontFamily: FONTS.bold,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  weeklyDate: {
    fontSize: 14,
    color: COLORS.zenText,
    fontFamily: FONTS.regular,
  },
  weeklyValue: {
    fontSize: 14,
    color: COLORS.accentMuted,
    fontFamily: FONTS.regular,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.zenText,
    fontFamily: FONTS.medium,
  },
  categoryValue: {
    fontSize: 14,
    color: COLORS.accentMuted,
    fontFamily: FONTS.medium,
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.zenText,
    marginBottom: 12,
    fontFamily: FONTS.bold,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  insightLabel: {
    fontSize: 12,
    color: COLORS.accentMuted,
    fontFamily: FONTS.regular,
  },
  insightValue: {
    fontSize: 12,
    color: COLORS.zenText,
    fontFamily: FONTS.medium,
  },
});
