import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Clock, Check } from 'lucide-react';
import { UserSettings, ActivityCategory } from '../types';
import * as DataService from '../services/dataService';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsViewProps {
  currentSettings: UserSettings;
  onClose: () => void;
  onSave: (s: UserSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentSettings, onClose, onSave }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const [availableCategories, setAvailableCategories] = useState<ActivityCategory[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
        const c = await DataService.getAllCategories();
        setAvailableCategories(c);
    };
    fetchCats();
  }, []);

  const toggleCategory = (cat: ActivityCategory) => {
    setSettings(prev => {
        const exists = prev.visibleCategories.includes(cat);
        const newCats = exists 
            ? prev.visibleCategories.filter(c => c !== cat)
            : [...prev.visibleCategories, cat];
        return { ...prev, visibleCategories: newCats };
    });
  };

  const handleSave = async () => {
    await DataService.saveSettings(settings);
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal text-offWhite flex flex-col animate-in slide-in-from-right duration-300">
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{t('settings')}</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
        
        {/* Ringtone */}
        <section>
            <div className="flex items-center gap-2 mb-4 text-sage">
                <Bell size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">{t('ringtone')}</h2>
            </div>
            <select 
                value={settings.ringtone}
                onChange={(e) => setSettings({...settings, ringtone: e.target.value})}
                className="w-full bg-[#36333a] border border-white/10 rounded-2xl p-4 text-offWhite outline-none focus:border-sage transition appearance-none"
            >
                <option value="Default" className="bg-[#36333a]">Zen Chime (Default)</option>
                <option value="Forest" className="bg-[#36333a]">Forest Sounds</option>
                <option value="Beep" className="bg-[#36333a]">Digital Beep</option>
            </select>
        </section>

        {/* Timers */}
        <section>
            <div className="flex items-center gap-2 mb-4 text-sage">
                <Clock size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">{t('timers')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs mb-2 opacity-60">{t('focus_session')}</label>
                    <input 
                        type="number" 
                        value={settings.focusDuration}
                        onChange={(e) => setSettings({...settings, focusDuration: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-offWhite outline-none focus:border-sage transition"
                    />
                </div>
                <div>
                    <label className="block text-xs mb-2 opacity-60">{t('happypause')}</label>
                    <input 
                        type="number" 
                        value={settings.pauseDuration}
                        onChange={(e) => setSettings({...settings, pauseDuration: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-offWhite outline-none focus:border-sage transition"
                    />
                </div>
            </div>
        </section>

        {/* Categories */}
        <section>
            <div className="flex items-center gap-2 mb-4 text-sage">
                <Check size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">{t('visible_categories')}</h2>
            </div>
            <div className="bg-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 border border-white/5">
                {availableCategories.map(cat => (
                    <div 
                        key={cat} 
                        onClick={() => toggleCategory(cat)}
                        className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition"
                    >
                        <div className="flex items-center gap-3">
                             {/* Simple generic icon for list */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${settings.visibleCategories.includes(cat) ? 'bg-sage/20 text-sage' : 'bg-white/5 text-offWhite/30'}`}>
                                <div className="w-2 h-2 rounded-full bg-current" />
                            </div>
                            <span className="capitalize">{t(cat).toLowerCase()}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${settings.visibleCategories.includes(cat) ? 'bg-sage border-sage text-charcoal' : 'border-white/20'}`}>
                            {settings.visibleCategories.includes(cat) && <Check size={14} strokeWidth={3} />}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <button 
            onClick={handleSave}
            className="w-full bg-sage text-charcoal font-bold text-lg py-4 rounded-2xl shadow-lg shadow-sage/20 hover:scale-[1.02] active:scale-[0.98] transition"
        >
            {t('save_changes')}
        </button>

      </main>
    </div>
  );
};

export default SettingsView;