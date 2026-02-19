import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, ThumbsUp, ThumbsDown, FastForward, CheckCircle, RefreshCw, PlusCircle, Settings as SettingsIcon, Info, Activity as ActivityIcon, Wind, MessageCircle, PenTool, EyeOff, Heart, Image as ImageIcon, Leaf } from 'lucide-react';
import CircularTimer from '../components/CircularTimer';
import { TimerMode, TimerState, Activity, UserSettings } from '../types';
import * as DataService from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface TimerTabProps {
  settings: UserSettings;
  openSettings: () => void;
  openCreateActivity: () => void;
  onModeChange?: (mode: TimerMode) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getEndTime = (secondsLeft: number, lang: string) => {
  const date = new Date(Date.now() + secondsLeft * 1000);
  const locale = lang === 'FR' ? 'fr-FR' : 'en-US';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

// Map categories to colors for placeholders
const CATEGORY_COLORS: Record<string, string> = {
    'FITNESS': 'FF7F50', // Coral
    'LEISURE': '87CEEB', // Sky Blue
    'SOCIAL': 'FF69B4',  // Hot Pink
    'MIND': '9370DB',    // Purple
    'SPIRITUAL': 'FFD700', // Gold
    'RELAXATION': '98FB98' // Pale Green
};

const ActivityIconRenderer: React.FC<{ activity?: Activity }> = ({ activity }) => {
    const iconName = activity?.iconName;
    const [imgError, setImgError] = useState(false);
    
    // Reset error state if activity changes
    useEffect(() => {
        setImgError(false);
    }, [activity?.id]);

    if (!iconName) return <Info size={32} className="text-sage" strokeWidth={1.2} />;

    // 1. Check for valid URL or Data URI
    if ((iconName.startsWith('http') || iconName.startsWith('data:')) && !imgError) {
        return (
            <img 
                src={iconName} 
                alt="Activity Icon" 
                className="w-full h-full object-cover rounded-lg"
                onError={() => setImgError(true)}
            />
        );
    }

    // 2. Check for local images folder (prioritize this for stick figures)
    // Updated to check for both 'images/' and './images/'
    if ((iconName.startsWith('images/') || iconName.startsWith('./images/')) && !imgError) {
        return (
            <img 
                src={iconName} 
                alt={activity?.title} 
                className="w-full h-full object-contain rounded-lg bg-charcoal"
                onError={() => setImgError(true)}
            />
        );
    }

    // 3. Fallback / Placeholder logic
    const catColor = CATEGORY_COLORS[activity?.category || 'FITNESS'] || 'b1b7a2';
    const titleText = activity?.title ? encodeURIComponent(activity.title) : 'Activity';
    // Using a placeholder service to generate an image with the title
    const placeholderUrl = `https://placehold.co/600x200/${catColor}/36333a?text=${titleText}&font=montserrat`;
    
    return (
        <img 
            src={placeholderUrl} 
            alt={activity?.title} 
            className="w-full h-full object-cover rounded-lg opacity-90 hover:opacity-100 transition shadow-lg shadow-black/20"
        />
    );
};

const TimerTab: React.FC<TimerTabProps> = ({ settings, openSettings, openCreateActivity, onModeChange }) => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [state, setState] = useState<TimerState>(TimerState.IDLE);
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  // Notify parent of mode changes
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useEffect(() => {
    if (state === TimerState.IDLE && mode === TimerMode.FOCUS) {
        setTimeLeft(settings.focusDuration * 60);
    }
  }, [settings.focusDuration]);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (state === TimerState.RUNNING) {
      timerRef.current = window.setInterval(tick, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, tick]);

  const handleTimerComplete = async () => {
    if (mode === TimerMode.FOCUS) {
      await DataService.addLog({
        timestamp: Date.now(),
        type: 'focus_stopped',
        duration: settings.focusDuration * 60
      });
      startBreak();
    } else {
      await DataService.addLog({
        timestamp: Date.now(),
        type: 'happypause_done',
        activityId: currentActivity?.id,
        activityName: currentActivity?.title,
        category: currentActivity?.category
      });
      startFocusSession();
    }
  };

  const startBreak = async () => {
    setIsLoadingActivity(true);
    const activity = await DataService.selectNextActivity(settings);
    setIsLoadingActivity(false);
    
    setCurrentActivity(activity);
    
    if (activity) {
        DataService.updateActivityFeedback(activity.id, 'shown');
        DataService.addLog({
            timestamp: Date.now(),
            type: 'happypause_started',
            activityId: activity.id,
            activityName: activity.title,
            category: activity.category
        });
    }
    setMode(TimerMode.PAUSE);
    setTimeLeft(settings.pauseDuration * 60);
    setState(TimerState.RUNNING);
  };

  const startFocusSession = () => {
    setMode(TimerMode.FOCUS);
    setTimeLeft(settings.focusDuration * 60);
    setState(TimerState.RUNNING);
    setCurrentActivity(null);
    DataService.addLog({ timestamp: Date.now(), type: 'focus_started' });
  };

  const resetToFocus = () => {
    setMode(TimerMode.FOCUS);
    setState(TimerState.IDLE);
    setTimeLeft(settings.focusDuration * 60);
    setCurrentActivity(null);
  };

  const toggleTimer = () => {
    if (state === TimerState.RUNNING) {
      setState(TimerState.PAUSED);
      DataService.addLog({ timestamp: Date.now(), type: 'focus_paused' });
    } else {
      setState(TimerState.RUNNING);
      DataService.addLog({ timestamp: Date.now(), type: mode === TimerMode.FOCUS ? 'focus_started' : 'focus_resumed' });
    }
  };

  const stopTimer = () => {
    setState(TimerState.IDLE);
    if (mode === TimerMode.FOCUS) {
      setTimeLeft(settings.focusDuration * 60);
      DataService.addLog({ timestamp: Date.now(), type: 'focus_stopped' });
    } else {
        resetToFocus();
    }
  };

  const restartTimer = () => {
    const total = mode === TimerMode.FOCUS ? settings.focusDuration * 60 : settings.pauseDuration * 60;
    setTimeLeft(total);
    setState(TimerState.RUNNING);
    DataService.addLog({ timestamp: Date.now(), type: 'focus_restarted' });
  };

  // Inter-related Voting Logic
  const handleFeedback = (type: 'up' | 'down') => {
    if (!currentActivity) return;

    let serverOp: 'increment_up' | 'decrement_up' | 'increment_down' | 'decrement_down';
    let newUp = currentActivity.thumbsUpCount;
    let newDown = currentActivity.thumbsDownCount;

    if (type === 'up') {
        if (newDown > 0) {
             // If there is down count, decrease it first
             newDown--;
             serverOp = 'decrement_down';
        } else {
             // Else increase up
             newUp++;
             serverOp = 'increment_up';
        }
    } else { // type === 'down'
        if (newUp > 0) {
            // If there is up count, decrease it first
            newUp--;
            serverOp = 'decrement_up';
        } else {
            // Else increase down
            newDown++;
            serverOp = 'increment_down';
        }
    }

    // Optimistic Update
    setCurrentActivity({
        ...currentActivity,
        thumbsUpCount: newUp,
        thumbsDownCount: newDown
    });

    // Server Call
    DataService.updateActivityFeedback(currentActivity.id, serverOp);

    // Logging
    DataService.addLog({
        timestamp: Date.now(),
        type: type === 'up' ? 'happypause_thumb_up' : 'happypause_thumb_down',
        activityId: currentActivity.id,
        activityName: currentActivity.title
    });
  };

  const cycleActivity = async () => {
    if (currentActivity) {
         DataService.addLog({ timestamp: Date.now(), type: 'happypause_cycled', activityId: currentActivity.id });
    }
    setIsLoadingActivity(true);
    const next = await DataService.selectNextActivity(settings);
    setIsLoadingActivity(false);
    setCurrentActivity(next);
  };

  const skipBreak = () => {
    if (currentActivity) {
        DataService.addLog({ timestamp: Date.now(), type: 'happypause_skipped', activityId: currentActivity.id });
    }
    startFocusSession();
  };

  const finishBreak = () => {
    if (currentActivity) {
        DataService.addLog({ timestamp: Date.now(), type: 'happypause_done', activityId: currentActivity.id });
    }
    startFocusSession();
  };

  const manualStartBreak = () => {
      DataService.addLog({ timestamp: Date.now(), type: 'focus_stopped' });
      startBreak();
  }

  useEffect(() => {
    if (timeLeft === 0 && state === TimerState.RUNNING) {
      handleTimerComplete();
    }
  }, [timeLeft, state]); 

  const totalTime = mode === TimerMode.FOCUS ? settings.focusDuration * 60 : settings.pauseDuration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className={`flex flex-col h-full relative ${mode === TimerMode.FOCUS ? 'pb-24' : 'pb-0'}`}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 shrink-0 z-20 relative">
        {mode === TimerMode.PAUSE ? (
            <button onClick={resetToFocus} className="text-offWhite/60 hover:text-offWhite">
                <span className="text-xl">✕</span>
            </button>
        ) : (
            <div className="flex items-center gap-2">
                <img src="./images/logo.svg" alt="HappyPause Logo" className="w-10 h-10 object-contain" />
                <span className="font-bold text-lg tracking-tight text-offWhite">HappyPause</span>
            </div>
        )}
        
        {mode === TimerMode.PAUSE && (
            <span className="absolute left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-offWhite opacity-80 whitespace-nowrap">{t('happypause_in_progress')}</span>
        )}
        
        <button onClick={openSettings} className="text-offWhite/60 hover:text-offWhite">
          <SettingsIcon size={24} />
        </button>
      </div>

      {/* Main Content - Raised Layout */}
      {/* Removed overflow-hidden to allow button to hang low */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 relative">
        
        {/* Content Wrapper raised by 40px (-translate-y-10) and using -mb-10 to reclaim space */}
        <div className="flex flex-col items-center w-full -translate-y-10 -mb-10">
            <div className="cursor-pointer relative z-10 shrink-0" onClick={() => {
                if (mode === TimerMode.PAUSE && currentActivity?.infoUrl) {
                    window.open(currentActivity.infoUrl, '_blank');
                }
            }}>
                <CircularTimer progress={progress} mode={mode} radius={180}>
                {mode === TimerMode.FOCUS ? (
                    <>
                    <div className="text-sage text-xs font-bold tracking-[0.2em] mb-2 uppercase -translate-y-5">{t('focus_session')}</div>
                    <div className="text-offWhite/50 text-xs font-medium mb-1 -translate-y-4">{t('ends_at')} {getEndTime(timeLeft, language)}</div>
                    <div className="text-6xl font-bold text-offWhite mb-2 tracking-tighter tabular-nums">
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-offWhite/50 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">{t('until_break')}</div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); manualStartBreak(); }}
                        className="px-4 py-2 bg-sage/10 rounded-full border border-sage/30 text-sage text-[10px] font-bold uppercase tracking-wide hover:bg-sage/20 transition"
                    >
                        {t('have_happypause')}
                    </button>
                    </>
                ) : (
                    <>
                    {isLoadingActivity ? (
                        <div className="text-sage animate-pulse">{t('loading')}...</div>
                    ) : (
                        <>
                        <div className="text-sage text-[10px] font-bold tracking-[0.2em] mb-1 uppercase opacity-80 mt-[11px]">{currentActivity ? t(currentActivity.category) : ''}</div>
                        <div className="text-offWhite text-xl font-bold leading-tight mb-2 max-w-[200px]">{currentActivity?.title}</div>
                        <p className="text-offWhite/60 text-[12px] leading-relaxed max-w-[210px] mb-2 line-clamp-3">{currentActivity?.description}</p>
                        <div className="flex items-center justify-center h-[60px] w-[180px] mb-2 mt-4 overflow-hidden rounded-lg">
                            <ActivityIconRenderer activity={currentActivity} />
                        </div>
                        <div className="text-4xl font-bold text-offWhite tracking-tighter tabular-nums mt-2">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-offWhite/40 text-[9px] font-bold tracking-[0.2em] uppercase mt-1">{t('remaining')}</div>
                        </>
                    )}
                    </>
                )}
                </CircularTimer>

                {mode === TimerMode.PAUSE && !isLoadingActivity && (
                    <div className="absolute bottom-[40px] left-0 w-full flex justify-between items-center px-12 pointer-events-none">
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleFeedback('down'); }} 
                                className={`w-12 h-12 rounded-full backdrop-blur border flex items-center justify-center transition-all duration-300 active:scale-95 ${
                                    (currentActivity?.thumbsDownCount || 0) > 0 
                                    ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                    : 'bg-charcoal/80 border-offWhite/10 text-offWhite/40 hover:text-red-400 hover:border-red-400/30'
                                }`}
                            >
                                <ThumbsDown size={20} fill={(currentActivity?.thumbsDownCount || 0) > 0 ? "currentColor" : "none"} />
                            </button>
                            <span className={`text-xs font-bold transition-colors ${(currentActivity?.thumbsDownCount || 0) > 0 ? 'text-red-500' : 'text-offWhite/30'}`}>
                                {currentActivity?.thumbsDownCount || 0}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 flex-row-reverse pointer-events-auto">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleFeedback('up'); }} 
                                className={`w-12 h-12 rounded-full backdrop-blur border flex items-center justify-center transition-all duration-300 active:scale-95 ${
                                    (currentActivity?.thumbsUpCount || 0) > 0 
                                    ? 'bg-sage/20 border-sage text-sage shadow-[0_0_15px_rgba(177,183,162,0.3)]' 
                                    : 'bg-charcoal/80 border-offWhite/10 text-offWhite/40 hover:text-sage hover:border-sage/30'
                                }`}
                            >
                                <ThumbsUp size={20} fill={(currentActivity?.thumbsUpCount || 0) > 0 ? "currentColor" : "none"} />
                            </button>
                            <span className={`text-xs font-bold transition-colors ${(currentActivity?.thumbsUpCount || 0) > 0 ? 'text-sage' : 'text-offWhite/30'}`}>
                                {currentActivity?.thumbsUpCount || 0}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            {/* Raised buttons by 20px (-translate-y-5) */}
            <div className="flex items-center justify-center gap-8 mt-8 shrink-0 -translate-y-5">
            {mode === TimerMode.FOCUS ? (
                <>
                    <button onClick={stopTimer} className="w-14 h-14 rounded-full bg-offWhite/10 flex items-center justify-center text-offWhite hover:bg-offWhite/20 transition active:scale-95">
                        <Square size={20} fill="currentColor" className="opacity-80"/>
                    </button>
                    <button onClick={toggleTimer} className="w-20 h-20 rounded-full bg-sage flex items-center justify-center text-charcoal shadow-lg shadow-sage/20 hover:scale-105 transition active:scale-95">
                        {state === TimerState.RUNNING ? (
                            <Pause size={32} fill="currentColor" />
                        ) : (
                            <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                    <button onClick={restartTimer} className="w-14 h-14 rounded-full bg-offWhite/10 flex items-center justify-center text-offWhite hover:bg-offWhite/20 transition active:scale-95">
                        <RotateCcw size={22} className="opacity-80"/>
                    </button>
                </>
            ) : (
                <>
                    <div className="relative flex flex-col items-center">
                        <button onClick={cycleActivity} className="w-14 h-14 rounded-full bg-offWhite/10 flex items-center justify-center text-offWhite hover:bg-offWhite/20 transition active:scale-95">
                            <RefreshCw size={22} className="opacity-80"/>
                        </button>
                        <span className="absolute top-full mt-3 text-[9px] font-bold uppercase tracking-widest text-offWhite/30">{t('cycle')}</span>
                    </div>

                    <div className="relative flex flex-col items-center">
                        <button onClick={finishBreak} className="w-20 h-20 rounded-full bg-sage flex items-center justify-center text-charcoal shadow-lg shadow-sage/20 hover:scale-105 transition active:scale-95">
                            <CheckCircle size={32} strokeWidth={2.5} />
                        </button>
                        <span className="absolute top-full mt-3 text-[9px] font-bold uppercase tracking-widest text-sage">{t('done')}</span>
                    </div>

                    <div className="relative flex flex-col items-center">
                        <button onClick={skipBreak} className="w-14 h-14 rounded-full bg-offWhite/10 flex items-center justify-center text-offWhite hover:bg-offWhite/20 transition active:scale-95">
                            <FastForward size={22} className="opacity-80"/>
                        </button>
                        <span className="absolute top-full mt-3 text-[9px] font-bold uppercase tracking-widest text-offWhite/30">{t('skip')}</span>
                    </div>
                </>
            )}
            </div>
        </div>

        {mode === TimerMode.PAUSE && (
            <button 
                onClick={openCreateActivity} 
                className="mt-auto mb-4 translate-y-8 flex items-center gap-2 px-6 py-3 rounded-xl border border-sage/30 bg-sage/5 hover:bg-sage/10 hover:border-sage transition shadow-sm shrink-0"
            >
                <PlusCircle size={16} className="text-sage" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-sage">{t('create_happypause')}</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default TimerTab;