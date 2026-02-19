import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, LogOut, Award, Star, ChevronDown, ChevronUp, Camera, Download, Trash2, ExternalLink, Mail, Upload, Link as LinkIcon, X, ArrowRight, Lock, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import * as DataService from '../services/dataService';
import { UserProfile } from '../types';

const TIMEZONES = [
  "GMT-12:00", "GMT-11:00", "GMT-10:00", "GMT-09:00", "GMT-08:00", "GMT-07:00", "GMT-06:00", "GMT-05:00", 
  "GMT-04:00", "GMT-03:30", "GMT-03:00", "GMT-02:00", "GMT-01:00", "GMT+00:00", 
  "GMT+01:00", "GMT+02:00", "GMT+03:00", "GMT+03:30", "GMT+04:00", "GMT+04:30", "GMT+05:00", "GMT+05:30", 
  "GMT+05:45", "GMT+06:00", "GMT+06:30", "GMT+07:00", "GMT+08:00", "GMT+09:00", "GMT+09:30", "GMT+10:00", 
  "GMT+11:00", "GMT+12:00", "GMT+13:00", "GMT+14:00"
];
const COUNTRIES = [
  "Canada", "United States", "France", "United Kingdom", "Germany", "Japan", "Australia", "Other"
];
const LANGUAGES = ["EN", "FR"];

interface ProfileTabProps {
  onLogout: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [imgError, setImgError] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStage, setEmailStage] = useState(0); 
  const [emailOldCode, setEmailOldCode] = useState('');
  const [emailNewAddr, setEmailNewAddr] = useState('');
  const [emailNewCode, setEmailNewCode] = useState('');
  const [emailError, setEmailError] = useState('');

  const [passState, setPassState] = useState<'idle' | 'code' | 'reset'>('idle');
  const [passCode, setPassCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [deleteState, setDeleteState] = useState<'idle' | 'code'>('idle');
  const [deleteCode, setDeleteCode] = useState('');

  const [notifSettings, setNotifSettings] = useState({
    sound: true,
    vibration: true
  });

  useEffect(() => {
    const loadProfile = async () => {
        const p = await DataService.getProfile();
        setProfile(p);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
        DataService.saveProfile(profile);
        // Reset error state if URL changes
        setImgError(false);
    }
  }, [profile]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLanguage(e.target.value as 'EN' | 'FR');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profile) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setProfile({...profile, avatarUrl: base64});
            setShowAvatarModal(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if(tempAvatarUrl && profile) {
        setProfile({...profile, avatarUrl: tempAvatarUrl});
        setShowAvatarModal(false);
        setTempAvatarUrl('');
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailStage(0);
    setEmailOldCode('');
    setEmailNewAddr('');
    setEmailNewCode('');
    setEmailError('');
  };

  const requestOldEmailCode = () => {
    alert("Code sent: 1111");
    setEmailStage(1);
    setEmailError('');
  };

  const verifyOldEmailCode = () => {
      if (emailOldCode === '1111') {
          setEmailStage(2);
          setEmailError('');
      } else {
          setEmailError(t('invalid_code'));
      }
  };

  const submitNewEmail = () => {
      if (emailNewAddr && emailNewAddr.includes('@')) {
          alert("Code sent: 2222");
          setEmailStage(3);
          setEmailError('');
      } else {
          setEmailError("Invalid email format");
      }
  };

  const verifyNewEmailCode = () => {
      if (emailNewCode === '2222' && profile) {
          setProfile({ ...profile, email: emailNewAddr });
          alert(t('email_updated'));
          closeEmailModal();
      } else {
          setEmailError(t('invalid_code'));
      }
  };

  const startPasswordReset = () => {
    alert("Code sent: 1234");
    setPassState('code');
  };
  const verifyPassCode = () => {
    if (passCode === '1234') { 
        setPassState('reset');
    } else {
        alert("Invalid code (Hint: use 1234)");
    }
  };
  const saveNewPassword = () => {
    if (newPass !== confirmPass) {
        alert("Passwords do not match");
        return;
    }
    alert("Password updated successfully!");
    setPassState('idle');
    setPassCode('');
    setNewPass('');
    setConfirmPass('');
  };

  const startDeleteAccount = () => {
     alert("Code sent: 6666");
     setDeleteState('code');
  };
  const confirmDeleteAccount = () => {
      if (deleteCode === '6666') {
          alert("Account deleted.");
          localStorage.clear();
          window.location.reload();
      } else {
          alert("Invalid code (Hint: use 6666)");
      }
  };

  const handleDownloadData = () => {
      alert("Downloading data...");
  };

  const openSystemSettings = () => {
      alert("Opening system settings...");
  };

  if (!profile) return <div className="text-center p-10">{t('loading')}...</div>;

  const displayName = (profile.firstName || profile.familyName) 
    ? `${profile.firstName} ${profile.familyName}`.trim() 
    : profile.email.split('@')[0];

  return (
    <div className="flex flex-col h-full bg-charcoal text-offWhite overflow-y-auto pb-32 relative no-scrollbar">
       <div className="px-6 pt-8 pb-4">
         <h1 className="text-2xl font-bold text-center">{t('profile')}</h1>
      </div>

      <div className="flex flex-col items-center mt-4 mb-8">
        <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            <div className="w-28 h-28 rounded-full bg-sage/20 border-2 border-sage p-1 overflow-hidden shadow-lg shadow-black/20 flex items-center justify-center">
                {!imgError ? (
                    <img 
                        src={profile.avatarUrl || DataService.DEFAULT_AVATAR_URL} 
                        alt="User" 
                        className="w-full h-full rounded-full object-cover group-hover:opacity-80 transition duration-300" 
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <User size={48} className="text-sage opacity-80" />
                )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-charcoal/50 rounded-full opacity-0 group-hover:opacity-100 transition">
                <Camera size={24} className="text-white" />
            </div>
        </div>
        <h2 className="text-xl font-bold mt-4">{displayName}</h2>
        <p className="text-sage text-sm">{profile.email}</p>
      </div>

      <div className="px-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2 px-2">{t('account')}</h3>
            
        {/* 1. Personal Information */}
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleSection('personal')} 
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage"><User size={18}/></div>
                    <span className="font-medium">{t('personal_info')}</span>
                </div>
                {expandedSection === 'personal' ? <ChevronUp size={16} className="text-sage" /> : <ChevronDown size={16} className="text-offWhite/30" />}
            </button>
            
            {expandedSection === 'personal' && (
                <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 animate-in slide-in-from-top-2">
                        <div className="space-y-3">
                        <label className="text-xs font-bold text-sage uppercase tracking-widest">{t('identity')}</label>
                        <div className="grid grid-cols-1 gap-3">
                            <input 
                                type="text" placeholder={t('name')} 
                                value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})}
                                className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none transition"
                            />
                            <input 
                                type="text" placeholder={t('surname')} 
                                value={profile.surname} onChange={e => setProfile({...profile, surname: e.target.value})}
                                className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none transition"
                            />
                            <input 
                                type="text" placeholder={t('family_name')} 
                                value={profile.familyName} onChange={e => setProfile({...profile, familyName: e.target.value})}
                                className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none transition"
                            />
                        </div>
                        </div>

                        <div className="space-y-2">
                        <label className="text-xs font-bold text-sage uppercase tracking-widest">{t('email')}</label>
                        <div className="relative">
                            <button 
                                onClick={() => setShowEmailModal(true)}
                                className="w-full bg-charcoal border border-white/10 rounded-lg pl-10 p-3 text-sm text-left hover:border-sage transition relative group"
                            >
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-offWhite/30 group-hover:text-sage transition" size={16} />
                                <span className="truncate block">{profile.email}</span>
                            </button>
                        </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-sage uppercase tracking-widest">{t('language')}</label>
                            <div className="relative">
                                <select 
                                    value={language} onChange={handleLanguageChange}
                                    className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none appearance-none"
                                >
                                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-offWhite/30 pointer-events-none"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-sage uppercase tracking-widest">{t('timezone')}</label>
                            <div className="relative">
                                <select 
                                    value={profile.timezone} onChange={e => setProfile({...profile, timezone: e.target.value})}
                                    className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none appearance-none"
                                >
                                        {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-offWhite/30 pointer-events-none"/>
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-sage uppercase tracking-widest">{t('country')}</label>
                            <div className="relative">
                                <select 
                                    value={profile.country} onChange={e => setProfile({...profile, country: e.target.value})}
                                    className="w-full bg-charcoal border border-white/10 rounded-lg p-3 text-sm focus:border-sage outline-none appearance-none"
                                >
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-offWhite/30 pointer-events-none"/>
                            </div>
                        </div>
                        </div>
                </div>
            )}
        </div>

        {/* 2. Notifications */}
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleSection('notifications')} 
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage"><Bell size={18}/></div>
                    <span className="font-medium">{t('notifications')}</span>
                </div>
                {expandedSection === 'notifications' ? <ChevronUp size={16} className="text-sage" /> : <ChevronDown size={16} className="text-offWhite/30" />}
            </button>
            
            {expandedSection === 'notifications' && (
                <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 animate-in slide-in-from-top-2">
                     <div className="flex items-center justify-between">
                        <span className="text-sm">{t('sound_notif')}</span>
                        <button 
                            onClick={() => setNotifSettings(s => ({...s, sound: !s.sound}))}
                            className={`w-10 h-6 rounded-full relative transition-colors ${notifSettings.sound ? 'bg-sage' : 'bg-white/10'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifSettings.sound ? 'left-5' : 'left-1'}`} />
                        </button>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm">{t('vibration_notif')}</span>
                        <button 
                            onClick={() => setNotifSettings(s => ({...s, vibration: !s.vibration}))}
                            className={`w-10 h-6 rounded-full relative transition-colors ${notifSettings.vibration ? 'bg-sage' : 'bg-white/10'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifSettings.vibration ? 'left-5' : 'left-1'}`} />
                        </button>
                     </div>
                     <button onClick={openSystemSettings} className="w-full py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition text-offWhite/70">
                        {t('go_system_settings')}
                     </button>
                </div>
            )}
        </div>

        {/* 3. Security */}
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleSection('security')} 
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage"><Shield size={18}/></div>
                    <span className="font-medium">{t('security')}</span>
                </div>
                {expandedSection === 'security' ? <ChevronUp size={16} className="text-sage" /> : <ChevronDown size={16} className="text-offWhite/30" />}
            </button>
            
            {expandedSection === 'security' && (
                <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 animate-in slide-in-from-top-2">
                     <button 
                        onClick={startPasswordReset}
                        className="w-full flex items-center justify-between bg-charcoal p-3 rounded-lg border border-white/10 hover:border-sage transition group"
                     >
                        <span className="text-sm">{t('modify_password')}</span>
                        <ArrowRight size={16} className="text-offWhite/30 group-hover:text-sage transition" />
                     </button>
                </div>
            )}
        </div>

        {/* 4. Data & Privacy (Commented Out) */}
        {/*
        <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
            <button 
                onClick={() => toggleSection('data')} 
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center text-sage"><Database size={18}/></div>
                    <span className="font-medium">{t('your_data')}</span>
                </div>
                {expandedSection === 'data' ? <ChevronUp size={16} className="text-sage" /> : <ChevronDown size={16} className="text-offWhite/30" />}
            </button>
            
            {expandedSection === 'data' && (
                <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 animate-in slide-in-from-top-2">
                     <button 
                        onClick={handleDownloadData}
                        className="w-full flex items-center gap-3 bg-charcoal p-3 rounded-lg border border-white/10 hover:border-sage transition"
                     >
                        <Download size={16} className="text-sage" />
                        <span className="text-sm">{t('download_data')}</span>
                     </button>
                     
                     <div className="pt-4 border-t border-white/5">
                        <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">{t('danger_zone')}</label>
                        <button 
                            onClick={startDeleteAccount}
                            className="w-full flex items-center gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
                        >
                            <Trash2 size={16} />
                            <span className="text-sm font-bold">{t('delete_account')}</span>
                        </button>
                     </div>
                </div>
            )}
        </div>
        */}

        <div className="h-4"/>

        <button onClick={onLogout} className="w-full py-4 rounded-xl border border-red-400/30 text-red-400 font-bold hover:bg-red-400/10 transition flex items-center justify-center gap-2">
            <LogOut size={18} />
            {t('logout')}
        </button>
        
        <p className="text-center text-offWhite/30 text-xs py-4">HappyPause v1.0.2</p>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-charcoal border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('change_avatar_title')}</h3>
                    <button onClick={() => setShowAvatarModal(false)}><X size={20} className="opacity-50 hover:opacity-100"/></button>
                </div>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-center gap-3 w-full p-4 rounded-xl border-2 border-dashed border-sage/40 hover:border-sage hover:bg-sage/5 transition cursor-pointer">
                        <Upload size={20} className="text-sage"/>
                        <span className="font-bold text-sm">{t('upload_option')}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </label>
                    
                    <div className="flex items-center gap-3 py-2">
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                        <span className="text-xs text-white/30 font-bold">{t('or')}</span>
                        <div className="h-[1px] flex-1 bg-white/10"></div>
                    </div>

                    <div className="relative">
                        <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
                        <input 
                            type="text" 
                            placeholder={t('url_option')}
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-sm focus:border-sage outline-none"
                            value={tempAvatarUrl}
                            onChange={e => setTempAvatarUrl(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    onClick={handleUrlSubmit}
                    disabled={!tempAvatarUrl}
                    className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                >
                    {t('save')}
                </button>
            </div>
        </div>
      )}

      {/* 2. Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-charcoal border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('change_email_title')}</h3>
                    <button onClick={closeEmailModal}><X size={20} className="opacity-50 hover:opacity-100"/></button>
                </div>

                {emailStage === 0 && (
                    <div className="space-y-4">
                        <p className="text-sm text-offWhite/70">{t('request_code_instruction')}</p>
                        <button onClick={requestOldEmailCode} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">
                            {t('request_code_btn')}
                        </button>
                    </div>
                )}

                {emailStage === 1 && (
                    <div className="space-y-4">
                        <input 
                            type="text" placeholder={t('enter_code_placeholder')}
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 text-center text-lg tracking-widest focus:border-sage outline-none"
                            value={emailOldCode} onChange={e => setEmailOldCode(e.target.value)}
                        />
                         {emailError && <p className="text-red-400 text-xs text-center font-bold">{emailError}</p>}
                        <button onClick={verifyOldEmailCode} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">{t('submit_btn')}</button>
                    </div>
                )}

                {emailStage === 2 && (
                    <div className="space-y-4">
                        <input 
                            type="email" placeholder={t('new_email_placeholder')}
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 focus:border-sage outline-none"
                            value={emailNewAddr} onChange={e => setEmailNewAddr(e.target.value)}
                        />
                        {emailError && <p className="text-red-400 text-xs text-center font-bold">{emailError}</p>}
                        <button onClick={submitNewEmail} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">{t('submit_btn')}</button>
                    </div>
                )}

                {emailStage === 3 && (
                     <div className="space-y-4">
                        <p className="text-sm text-offWhite/70">{t('enter_new_code_instruction')}</p>
                        <input 
                            type="text" placeholder="Code"
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 text-center text-lg tracking-widest focus:border-sage outline-none"
                            value={emailNewCode} onChange={e => setEmailNewCode(e.target.value)}
                        />
                        {emailError && <p className="text-red-400 text-xs text-center font-bold">{emailError}</p>}
                        <button onClick={verifyNewEmailCode} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">{t('confirm_change_btn')}</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 3. Password Modal */}
      {passState !== 'idle' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-charcoal border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{passState === 'code' ? t('verify') : t('new_password')}</h3>
                    <button onClick={() => setPassState('idle')}><X size={20} className="opacity-50 hover:opacity-100"/></button>
                </div>
                
                {passState === 'code' ? (
                    <div className="space-y-4">
                         <p className="text-sm text-offWhite/70">{t('enter_code_email')}</p>
                         <input 
                            type="text" placeholder="1234"
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 text-center text-lg tracking-widest focus:border-sage outline-none"
                            value={passCode} onChange={e => setPassCode(e.target.value)}
                        />
                        <button onClick={verifyPassCode} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">{t('verify')}</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input 
                            type="password" placeholder={t('new_password')}
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 focus:border-sage outline-none"
                            value={newPass} onChange={e => setNewPass(e.target.value)}
                        />
                        <input 
                            type="password" placeholder={t('confirm_password')}
                            className="w-full bg-black/20 border border-white/10 rounded-xl h-12 px-4 focus:border-sage outline-none"
                            value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                        />
                        <button onClick={saveNewPassword} className="w-full bg-sage text-charcoal font-bold py-3 rounded-xl hover:opacity-90 transition">{t('save_password')}</button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* 4. Delete Account Modal */}
      {deleteState !== 'idle' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-charcoal border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl border-red-500/30">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-red-400">{t('delete_account')}</h3>
                    <button onClick={() => setDeleteState('idle')}><X size={20} className="opacity-50 hover:opacity-100"/></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-offWhite/70">{t('enter_code_confirm')}</p>
                    <input 
                        type="text" placeholder="6666"
                        className="w-full bg-black/20 border border-red-500/30 rounded-xl h-12 px-4 text-center text-lg tracking-widest focus:border-red-500 outline-none"
                        value={deleteCode} onChange={e => setDeleteCode(e.target.value)}
                    />
                    <button onClick={confirmDeleteAccount} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition">{t('confirm')}</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ProfileTab;