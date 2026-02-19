import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { getStats } from '../services/statsService';
import type { Stats } from '../types';

export default function StatsTab() {
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
      <View className="flex-1 bg-charcoal items-center justify-center">
        <ActivityIndicator size="large" color="#b1b7a2" />
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View className="flex-1 bg-charcoal items-center justify-center">
        <Text className="text-offWhite">{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-charcoal"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#b1b7a2" />}
    >
      <View className="p-6">
        <Text className="text-offWhite text-2xl font-bold mb-6">Stats</Text>
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-offWhite/10 rounded-xl p-4">
            <Text className="text-offWhite/70 text-sm">Total Focus</Text>
            <Text className="text-sage text-2xl font-bold">
              {stats?.totalFocusTime ?? 0} min
            </Text>
          </View>
          <View className="flex-1 bg-offWhite/10 rounded-xl p-4">
            <Text className="text-offWhite/70 text-sm">Total Pause</Text>
            <Text className="text-sage text-2xl font-bold">
              {stats?.totalPauseTime ?? 0} min
            </Text>
          </View>
        </View>
        <Text className="text-offWhite font-bold mb-3">Weekly</Text>
        {stats?.weeklyData?.map((d) => (
          <View key={d.date} className="flex-row justify-between py-2 border-b border-offWhite/10">
            <Text className="text-offWhite">{d.date}</Text>
            <Text className="text-sage">
              Focus: {d.focusMinutes}m / Pause: {d.pauseMinutes}m
            </Text>
          </View>
        ))}
        <Text className="text-offWhite font-bold mt-6 mb-3">By Category</Text>
        {stats?.categoryBreakdown &&
          Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
            <View key={cat} className="flex-row justify-between py-2">
              <Text className="text-offWhite">{cat}</Text>
              <Text className="text-sage">{count}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}
