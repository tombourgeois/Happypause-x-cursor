import React, { useState, useEffect } from 'react';
import * as DataService from '../services/dataService';
import { LogEntry } from '../types';
import { CheckCircle, Play, Pause, Square, SkipForward, ThumbsUp, ThumbsDown, RotateCcw, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HistoryTab: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchLogs = async () => {
        const data = await DataService.getLogs();
        setLogs(data);
    };
    fetchLogs();
  }, []);

  const getIcon = (type: LogEntry['type']) => {
    switch (type) {
        case 'focus_started': return <Play size={16} />;
        case 'focus_stopped': return <Square size={16} />;
        case 'focus_paused': return <Pause size={16} />;
        case 'happypause_started': return <Play size={16} className="text-sage" />;
        case 'happypause_done': return <CheckCircle size={16} className="text-sage" />;
        case 'happypause_skipped': return <SkipForward size={16} className="text-offWhite/40" />;
        case 'happypause_thumb_up': return <ThumbsUp size={16} className="text-sage" />;
        case 'happypause_thumb_down': return <ThumbsDown size={16} className="text-red-400" />;
        case 'happypause_created': return <Plus size={16} className="text-sage" />;
        default: return <RotateCcw size={16} />;
    }
  };

  const getLabel = (log: LogEntry) => {
    const map: Record<string, string> = {
        'focus_started': 'log_focus_started',
        'focus_stopped': 'log_focus_stopped',
        'focus_paused': 'log_focus_paused',
        'focus_resumed': 'log_focus_resumed',
        'focus_restarted': 'log_focus_restarted',
        'happypause_done': 'log_happypause_done',
        'happypause_started': 'log_happypause_started',
        'happypause_skipped': 'log_happypause_skipped',
        'happypause_cycled': 'log_happypause_cycled',
        'happypause_thumb_up': 'log_happypause_thumb_up',
        'happypause_thumb_down': 'log_happypause_thumb_down',
        'happypause_created': 'log_happypause_created'
    };
    const key = map[log.type];
    return key ? t(key) : log.type;
  };

  const groupedLogs: Record<string, LogEntry[]> = {};
  logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!groupedLogs[date]) groupedLogs[date] = [];
      groupedLogs[date].push(log);
  });

  return (
    <div className="flex flex-col h-full bg-charcoal text-offWhite overflow-y-auto pb-32 no-scrollbar">
      <div className="px-6 pt-8 pb-4 sticky top-0 bg-charcoal/95 backdrop-blur z-10 border-b border-white/5">
         <h1 className="text-2xl font-bold">{t('history')}</h1>
      </div>
      
      <div className="px-6 pt-4">
        {Object.entries(groupedLogs).map(([date, dayLogs]) => (
            <div key={date} className="mb-8">
                <h3 className="text-sage text-xs font-bold uppercase tracking-widest mb-4 opacity-80">{date === new Date().toLocaleDateString() ? t('today') : date}</h3>
                <div className="space-y-6 relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-white/10" />
                    
                    {dayLogs.map((log) => (
                        <div key={log.id} className="flex gap-4 relative z-0">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 bg-charcoal ${log.type.includes('happypause') ? 'text-sage' : 'text-offWhite/60'}`}>
                                    {getIcon(log.type)}
                                </div>
                            </div>
                            <div className="pt-1 pb-2">
                                <p className="font-medium text-sm text-offWhite">{getLabel(log)}</p>
                                {log.activityName && (
                                    <p className="text-xs text-sage mt-0.5 uppercase tracking-wide font-bold opacity-80">
                                        {log.category ? `${t(log.category)} • ` : ''}{log.activityName}
                                    </p>
                                )}
                                <p className="text-xs text-offWhite/30 mt-1">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
        {logs.length === 0 && (
            <div className="text-center py-20 text-offWhite/30">{t('no_history')}</div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;