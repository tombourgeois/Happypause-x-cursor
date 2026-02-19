import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { getLogs } from '../services/logService';
import type { LogEntry } from '../types';

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
      <View className="flex-1 bg-charcoal items-center justify-center">
        <ActivityIndicator size="large" color="#b1b7a2" />
      </View>
    );
  }

  if (error && logs.length === 0) {
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
        <Text className="text-offWhite text-2xl font-bold mb-6">History</Text>
        {logs.map((log) => (
          <View
            key={log.id}
            className="py-3 border-b border-offWhite/10 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-offWhite font-medium">
                {TYPE_LABELS[log.type] || log.type}
              </Text>
              {log.activityName && (
                <Text className="text-offWhite/70 text-sm">{log.activityName}</Text>
              )}
            </View>
            <Text className="text-offWhite/60 text-sm">
              {new Date(log.timestamp).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
