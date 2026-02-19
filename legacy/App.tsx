import React, { useState, useEffect } from 'react';
import { Timer, BarChart2, History, User } from 'lucide-react';
import { AppTab, UserSettings, TimerMode } from './types';
import * as DataService from './services/dataService';
import TimerTab from './views/TimerTab';
import StatsTab from './views/StatsTab';
import HistoryTab from './views/HistoryTab';
import ProfileTab from './views/ProfileTab';
import SettingsView from './views/SettingsView';
import CreateActivityView from './views/CreateActivityView';
import LoginView from './views/LoginView';
import SignUpView from './views/SignUpView';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TIMER);
  const [timerMode, setTimerMode] = useState<TimerMode>(TimerMode.FOCUS);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
        const s = await DataService.getSettings();
        setSettings(s);
        DataService.recordAppOpen();
    };
    init();
  }, []);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  if (!settings) return null; // Or loader

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.TIMER:
        return (
            <TimerTab 
                settings={settings} 
                openSettings={() => setShowSettings(true)} 
                openCreateActivity={() => setShowCreateActivity(true)}
                onModeChange={setTimerMode}
            />
        );
      case AppTab.STATS:
        return <StatsTab />;
      case AppTab.HISTORY:
        return <HistoryTab />;
      case AppTab.PROFILE:
        return <ProfileTab onLogout={onLogout} />;
      default:
        return null;
    }
  };

  // Determine if footer should be visible
  // Hidden only when in Timer tab AND in Pause mode (HappyPause overlay)
  const showFooter = !(activeTab === AppTab.TIMER && timerMode === TimerMode.PAUSE);

  return (
    <div className="bg-charcoal min-h-screen text-offWhite font-sans flex flex-col overflow-hidden relative selection:bg-sage selection:text-charcoal">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative h-full">
        {renderContent()}
      </div>

      {/* Fixed Bottom Navigation Footer */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 h-24 z-40 px-6 pb-6 pt-2 bg-gradient-to-t from-charcoal via-charcoal to-transparent pointer-events-none">
            <nav className="h-full bg-white/5 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-around px-2 shadow-2xl pointer-events-auto">
                <NavButton 
                    active={activeTab === AppTab.TIMER} 
                    onClick={() => setActiveTab(AppTab.TIMER)} 
                    icon={<Timer size={22} />} 
                    label={t('nav_timer')} 
                />
                <NavButton 
                    active={activeTab === AppTab.STATS} 
                    onClick={() => setActiveTab(AppTab.STATS)} 
                    icon={<BarChart2 size={22} />} 
                    label={t('nav_stats')} 
                />
                <NavButton 
                    active={activeTab === AppTab.HISTORY} 
                    onClick={() => setActiveTab(AppTab.HISTORY)} 
                    icon={<History size={22} />} 
                    label={t('nav_history')} 
                />
                <NavButton 
                    active={activeTab === AppTab.PROFILE} 
                    onClick={() => setActiveTab(AppTab.PROFILE)} 
                    icon={<User size={22} />} 
                    label={t('nav_profile')} 
                />
            </nav>
        </div>
      )}

      {showSettings && (
        <SettingsView 
            currentSettings={settings} 
            onClose={() => setShowSettings(false)} 
            onSave={handleSaveSettings} 
        />
      )}

      {showCreateActivity && (
        <CreateActivityView 
            onClose={() => setShowCreateActivity(false)} 
        />
      )}

      {/* Background Decor */}
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-sage/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-sage/5 rounded-full blur-3xl pointer-events-none z-0" />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${active ? 'text-charcoal' : 'text-offWhite/40 hover:text-offWhite'}`}
    >
        <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-sage translate-y-[-10px] shadow-lg shadow-sage/30' : ''}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-bold transition-all duration-300 ${active ? 'opacity-100 translate-y-[-5px] text-sage' : 'opacity-0 h-0 overflow-hidden'}`}>
            {label}
        </span>
    </button>
);

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In real app, check Supabase session
        const storedAuth = localStorage.getItem('happypause_auth');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleLogin = () => {
        localStorage.setItem('happypause_auth', 'true');
        setIsAuthenticated(true);
        setAuthMode('LOGIN'); 
    };

    const handleLogout = () => {
        localStorage.removeItem('happypause_auth');
        setIsAuthenticated(false);
    };

    if (isLoading) return null; 

    if (!isAuthenticated) {
        if (authMode === 'SIGNUP') {
            return (
                <SignUpView 
                    onSignUp={handleLogin} 
                    onLoginClick={() => setAuthMode('LOGIN')} 
                />
            );
        }
        return (
            <LoginView 
                onLogin={handleLogin} 
                onSignUpClick={() => setAuthMode('SIGNUP')} 
            />
        );
    }

    return (
        <LanguageProvider>
            <AppContent onLogout={handleLogout} />
        </LanguageProvider>
    );
}

export default App;