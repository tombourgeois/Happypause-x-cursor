import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts';
import { Timer, Zap, TrendingUp, Activity } from 'lucide-react';
import * as DataService from '../services/dataService';
import { LogEntry, ActivityCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const StatsTab: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
        const data = await DataService.getLogs();
        setLogs(data);
        setLoading(false);
    };
    fetchLogs();
  }, []);

  const stats = useMemo(() => {
    let focusTime = 0;
    let pauseTime = 0;
    const categoryCounts: Record<string, number> = {};
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { day: d.toLocaleDateString('en-US', { weekday: 'narrow' }), focus: 0, pause: 0 };
    });

    logs.forEach(log => {
        if (log.type === 'focus_stopped' || log.type === 'focus_paused') {
            focusTime += (log.duration || 1500) / 60; 
        }
        if (log.type === 'happypause_done') {
            pauseTime += 5; 
            if (log.category) {
                categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
            }
        }
        
        const logDate = new Date(log.timestamp);
        const dayDiff = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff < 7 && dayDiff >= 0) {
            const idx = 6 - dayDiff;
            if (log.type.startsWith('focus')) last7Days[idx].focus += (log.duration || 1500) / 60;
            if (log.type.startsWith('happypause')) last7Days[idx].pause += 5;
        }
    });

    return { 
        focusTotal: Math.round(focusTime / 60), 
        pauseTotal: Math.round(pauseTime / 60), 
        categoryCounts,
        chartData: last7Days 
    };
  }, [logs]);

  if (loading) {
      return <div className="flex h-full items-center justify-center text-sage">{t('loading')}...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-charcoal text-offWhite overflow-y-auto pb-32 no-scrollbar">
      <div className="px-6 pt-8 pb-4 sticky top-0 bg-charcoal/95 backdrop-blur z-10">
         <h1 className="text-2xl font-bold">{t('statistics')}</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Top Cards */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-sage">
                    <Timer size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('focus_time')}</span>
                </div>
                <div className="text-2xl font-bold">{stats.focusTotal}h <span className="text-lg font-normal opacity-60">{t('total')}</span></div>
            </div>
            <div className="bg-sage/10 rounded-2xl p-5 border border-sage/20">
                <div className="flex items-center gap-2 mb-2 text-brightGreen">
                    <Zap size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('happypause')}</span>
                </div>
                <div className="text-2xl font-bold text-brightGreen">{stats.pauseTotal}h <span className="text-lg font-normal opacity-60 text-offWhite">{t('total')}</span></div>
            </div>
        </div>

        {/* Weekly Chart */}
        <div>
            <div className="flex justify-between items-end mb-4">
                <h3 className="font-bold">{t('weekly_activity')}</h3>
                <div className="flex gap-3 text-[10px] font-bold uppercase text-offWhite/40">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sage"></span> {t('focus')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brightGreen"></span> {t('pause')}</span>
                </div>
            </div>
            <div className="h-48 w-full bg-white/5 rounded-2xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartData} barGap={4}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#b1b7a2', fontSize: 10}} dy={10} />
                        <Bar dataKey="focus" fill="#b1b7a2" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pause" fill="#abec13" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Category Breakdown */}
        <div>
            <h3 className="font-bold mb-4">{t('category_breakdown')}</h3>
            <div className="space-y-4">
                {Object.entries(stats.categoryCounts as Record<string, number>).map(([cat, count]) => {
                    const total = Object.values(stats.categoryCounts as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                        <div key={cat} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{t(cat)}</span>
                                <span className="text-sage">{count} {t('sessions')}</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-sage" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
                {Object.keys(stats.categoryCounts).length === 0 && (
                    <p className="text-sm text-offWhite/30 italic">{t('no_activity')}</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;