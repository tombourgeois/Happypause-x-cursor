import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as DataService from '../services/dataService';
import { UserSettings } from '../types';

type Language = 'EN' | 'FR';

const translations = {
  EN: {
    focus_session: "FOCUS SESSION",
    ends_at: "Ends at",
    until_break: "Until pause",
    have_happypause: "Have a HappyPause",
    happypause_in_progress: "HAPPYPAUSE IN PROGRESS",
    press_know_more: "PRESS TO KNOW MORE",
    remaining: "Remaining",
    cycle: "Cycle",
    done: "Done",
    skip: "Skip",
    create_happypause: "Create a HappyPause",
    statistics: "Statistics",
    focus_time: "Focus Time",
    total: "Total",
    happypause: "HappyPause",
    weekly_activity: "Weekly Activity",
    focus: "Focus",
    pause: "Pause",
    category_breakdown: "Category Breakdown",
    sessions: "sessions",
    no_activity: "No pause activity recorded yet.",
    history: "History",
    today: "Today",
    no_history: "No history yet. Start a focus session!",
    log_focus_started: "Focus Session Started",
    log_focus_stopped: "Focus Session Stopped",
    log_focus_paused: "Focus Session Paused",
    log_focus_resumed: "Focus Session Resumed",
    log_focus_restarted: "Focus Session Restarted",
    log_happypause_done: "HappyPause Completed",
    log_happypause_started: "HappyPause Started",
    log_happypause_skipped: "HappyPause Skipped",
    log_happypause_cycled: "HappyPause Cycled",
    log_happypause_thumb_up: "Liked Activity",
    log_happypause_thumb_down: "Disliked Activity",
    log_happypause_created: "New Activity Created",
    profile: "Profile",
    stats_glance: "Stats at a glance",
    level_5: "Level 5",
    sessions_milestone: "Milestone reached",
    happypauses_count_label: "HappyPauses",
    streak_label: "Day Streak",
    consistency_king: "Consistency King",
    account: "Account",
    personal_info: "Personal Information",
    identity: "Identity",
    name: "Name",
    surname: "Surname",
    family_name: "Family Name",
    email: "Email",
    language: "Language",
    timezone: "Time Zone",
    country: "Country",
    security: "Security",
    password: "Password",
    modify_password: "Modify Password",
    enter_code_email: "Enter code sent to email",
    verify: "Verify",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    save_password: "Save New Password",
    your_data: "Your Data",
    download_data: "Download Data",
    danger_zone: "Danger Zone",
    delete_account: "Delete my account",
    enter_code_confirm: "Enter code to confirm deletion",
    confirm: "Confirm",
    terms: "Terms and conditions",
    notifications: "Notifications",
    sound_notif: "Sound Notification",
    vibration_notif: "Vibration Notification",
    go_system_settings: "Go to system settings",
    logout: "Log Out",
    change_avatar_title: "Change Profile Picture",
    upload_option: "Upload from Device",
    url_option: "Paste Image URL",
    or: "OR",
    cancel: "Cancel",
    save: "Save",
    change_email_title: "CHANGE EMAIL",
    request_code_instruction: "To change your email please request code",
    request_code_btn: "REQUEST CODE",
    enter_code_placeholder: "Enter code",
    new_email_placeholder: "New Email Address",
    submit_btn: "Submit",
    enter_new_code_instruction: "Entrez le code envoyé au nouvel email",
    confirm_change_btn: "Confirm Change",
    invalid_code: "Invalid code",
    email_updated: "Email updated successfully",
    settings: "Settings",
    ringtone: "Ringtone",
    timers: "Timers (Minutes)",
    visible_categories: "Visible Categories",
    save_changes: "Save Changes",
    category: "Category",
    select_category: "Select Category",
    create_new: "+ Create new...",
    type_new_category: "Type new category...",
    happypause_name: "HappyPause Name",
    description: "Description",
    icon: "Icon",
    upload_icon: "Upload custom icon",
    png_jpg_hint: "PNG, JPG up to 5MB",
    info_link: "Additional Info Link",
    make_public: "Make public for community",
    agree_terms: "I agree to Terms & Privacy Policy",
    add_submit: "Add & Submit",
    nav_timer: "Timer",
    nav_stats: "Stats",
    nav_history: "History",
    nav_profile: "Profile",
    FITNESS: "FITNESS",
    LEISURE: "LEISURE",
    SOCIAL: "SOCIAL",
    MIND: "MIND",
    SPIRITUAL: "SPIRITUAL",
    RELAXATION: "RELAXATION",
    loading: "Loading"
  },
  FR: {
    focus_session: "SESSION FOCUS",
    ends_at: "Fin à",
    until_break: "Avant la pause",
    have_happypause: "Prendre une HappyPause",
    happypause_in_progress: "HAPPYPAUSE EN COURS",
    press_know_more: "APPUYER POUR EN SAVOIR PLUS",
    remaining: "Restant",
    cycle: "Changer",
    done: "Fait",
    skip: "Passer",
    create_happypause: "Créer une HappyPause",
    statistics: "Statistiques",
    focus_time: "Temps de Focus",
    total: "Total",
    happypause: "HappyPause",
    weekly_activity: "Activité Hebdomadaire",
    focus: "Focus",
    pause: "Pause",
    category_breakdown: "Répartition par Catégorie",
    sessions: "sessions",
    no_activity: "Aucune activité enregistrée.",
    history: "Historique",
    today: "Aujourd'hui",
    no_history: "Pas encore d'historique.",
    log_focus_started: "Session Focus Commencée",
    log_focus_stopped: "Session Focus Arrêtée",
    log_focus_paused: "Session Focus En Pause",
    log_focus_resumed: "Session Focus Reprise",
    log_focus_restarted: "Session Focus Redémarrée",
    log_happypause_done: "HappyPause Terminée",
    log_happypause_started: "HappyPause Commencée",
    log_happypause_skipped: "HappyPause Passée",
    log_happypause_cycled: "HappyPause Changée",
    log_happypause_thumb_up: "Activité Aimée",
    log_happypause_thumb_down: "Activité Non Aimée",
    log_happypause_created: "Nouvelle Activité Créée",
    profile: "Profil",
    stats_glance: "Stats en bref",
    level_5: "Niveau 5",
    sessions_milestone: "Étape atteinte",
    happypauses_count_label: "HappyPauses",
    streak_label: "Jours de Suite",
    consistency_king: "Roi de la régularité",
    account: "Compte",
    personal_info: "Informations Personnelles",
    identity: "Identité",
    name: "Prénom",
    surname: "Deuxième Prénom",
    family_name: "Nom de Famille",
    email: "Email",
    language: "Langue",
    timezone: "Fuseau Horaire",
    country: "Pays",
    security: "Sécurité",
    password: "Mot de passe",
    modify_password: "Modifier Mot de Passe",
    enter_code_email: "Entrez le code reçu par email",
    verify: "Vérifier",
    new_password: "Nouveau Mot de Passe",
    confirm_password: "Confirmer Mot de Passe",
    save_password: "Enregistrer",
    your_data: "Vos Données",
    download_data: "Télécharger Données",
    danger_zone: "Zone de Danger",
    delete_account: "Supprimer mon compte",
    enter_code_confirm: "Entrez le code pour confirmer",
    confirm: "Confirmer",
    terms: "Conditions générales",
    notifications: "Notifications",
    sound_notif: "Notification Sonore",
    vibration_notif: "Notification Vibration",
    go_system_settings: "Aller aux paramètres système",
    logout: "Se Déconnecter",
    change_avatar_title: "Changer Photo de Profil",
    upload_option: "Télécharger depuis l'appareil",
    url_option: "Coller URL de l'image",
    or: "OU",
    cancel: "Annuler",
    save: "Enregistrer",
    change_email_title: "CHANGER EMAIL",
    request_code_instruction: "Pour changer votre email, demandez un code",
    request_code_btn: "DEMANDER CODE",
    enter_code_placeholder: "Entrer le code",
    new_email_placeholder: "Nouvelle adresse email",
    submit_btn: "Soumettre",
    enter_new_code_instruction: "Entrez le code envoyé au nouvel email",
    confirm_change_btn: "Confirmer Changement",
    invalid_code: "Code invalide",
    email_updated: "Email mis à jour avec succès",
    settings: "Paramètres",
    ringtone: "Sonnerie",
    timers: "Minuteurs (Minutes)",
    visible_categories: "Catégories Visibles",
    save_changes: "Enregistrer",
    category: "Catégorie",
    select_category: "Sélectionner Catégorie",
    create_new: "+ Créer nouvelle...",
    type_new_category: "Nouvelle catégorie...",
    happypause_name: "Nom de la HappyPause",
    description: "Description",
    icon: "Icône",
    upload_icon: "Uploader icône perso",
    png_jpg_hint: "PNG, JPG jusqu'à 5MB",
    info_link: "Lien d'info additionnel",
    make_public: "Rendre public pour la communauté",
    agree_terms: "J'accepte les Conditions & Confidentialité",
    add_submit: "Ajouter & Soumettre",
    nav_timer: "Timer",
    nav_stats: "Stats",
    nav_history: "Historique",
    nav_profile: "Profile",
    FITNESS: "FORME",
    LEISURE: "LOISIR",
    SOCIAL: "SOCIAL",
    MIND: "ESPRIT",
    SPIRITUAL: "SPIRITUEL",
    RELAXATION: "RELAXATION",
    loading: "Chargement"
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('EN');

  useEffect(() => {
    const init = async () => {
        const settings = await DataService.getSettings();
        setLanguageState(settings.language as Language);
    };
    init();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    const settings = await DataService.getSettings();
    settings.language = lang;
    await DataService.saveSettings(settings);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    // @ts-ignore
    return dict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};