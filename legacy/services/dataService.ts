import { supabase } from '../lib/supabase';
import { Activity, ActivityCategory, LogEntry, UserSettings, UserProfile } from '../types';

// --- CONSTANTS ---
const STORAGE_KEYS = {
  SETTINGS: 'happypause_settings',
  PROFILE: 'happypause_profile',
  LOGS: 'happypause_logs',
  CUSTOM_ACTIVITIES: 'happypause_custom_activities',
  ACTIVITY_STATES: 'happypause_activity_states' // To store votes/lastShown for default activities
};

const DEFAULT_CATEGORIES = ['FITNESS', 'LEISURE', 'SOCIAL', 'MIND', 'SPIRITUAL', 'RELAXATION'];

// Link to the default profile image file
export const DEFAULT_AVATAR_URL = './images/default-profile.svg';

const DEFAULT_SETTINGS: UserSettings = {
  focusDuration: 55,
  pauseDuration: 5,
  visibleCategories: [...DEFAULT_CATEGORIES],
  ringtone: 'Default',
  language: 'EN',
};

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  surname: "",
  familyName: "",
  email: "Poutineman@gmail.com",
  timezone: "GMT-05:00",
  country: "Canada",
  avatarUrl: DEFAULT_AVATAR_URL,
  loginDates: []
};

// --- DEFAULT ACTIVITIES ---
const DEFAULT_ACTIVITIES: Activity[] = [
  // FITNESS (Category 1)
  { id: '000100000001', category: 'FITNESS', title: 'Wall push-ups', description: 'Stand facing a wall, hands at shoulder height. Do 12 slow push-ups, focusing on control and breathing.', iconName: './images/FITNESS-000100000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Push-up', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000002', category: 'FITNESS', title: 'Bodyweight squats', description: 'Feet shoulder-width apart. Do 12 slow squats, keeping heels down and chest open.', iconName: './images/FITNESS-000100000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Squat_(exercise)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000003', category: 'FITNESS', title: 'Plank reset', description: 'Hold a forearm plank for 30–45 seconds. Keep a straight line from head to heels. Breathe steadily.', iconName: './images/FITNESS-000100000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Plank_(exercise)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000004', category: 'FITNESS', title: 'Glute bridges', description: 'Lie on your back, knees bent. Lift hips and squeeze glutes for 12 reps. Slow tempo.', iconName: './images/FITNESS-000100000004.png', infoUrl: 'https://en.wikipedia.org/wiki/Glute_bridge', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000005', category: 'FITNESS', title: 'Calf raises', description: 'Hold onto a chair for balance. Rise onto toes and lower slowly for 20 reps.', iconName: './images/FITNESS-000100000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Calf_raise', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000006', category: 'FITNESS', title: 'Standing lunges', description: 'Do 8 lunges per side. Keep front knee tracking over toes and torso upright.', iconName: './images/FITNESS-000100000006.png', infoUrl: 'https://en.wikipedia.org/wiki/Lunge_(exercise)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000007', category: 'FITNESS', title: 'Jumping jacks (low impact)', description: 'Do 45 seconds of step-jacks (one leg out at a time). Keep it comfortable.', iconName: './images/FITNESS-000100000007.png', infoUrl: 'https://en.wikipedia.org/wiki/Jumping_jack', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000008', category: 'FITNESS', title: 'Shoulder mobility circles', description: 'Make 10 large arm circles forward, then 10 backward. Keep ribs down and neck relaxed.', iconName: './images/FITNESS-000100000008.png', infoUrl: 'https://en.wikipedia.org/wiki/Shoulder', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000009', category: 'FITNESS', title: 'Chair triceps dips (gentle)', description: 'Hands on chair edge, bend elbows slightly and press back up for 10 reps. Keep it shallow.', iconName: './images/FITNESS-000100000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Triceps_dip', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000100000010', category: 'FITNESS', title: 'Stair climb (moderate)', description: 'Climb one flight of stairs up and down twice at a moderate pace. Hydrate after.', iconName: './images/FITNESS-000100000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Stair_climbing', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },

  // LEISURE (Category 2)
  { id: '000200000001', category: 'LEISURE', title: 'One-song break', description: 'Play one song you enjoy and listen without multitasking until it ends.', iconName: './images/LEISURE-000200000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Active_listening', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000002', category: 'LEISURE', title: 'Quick tidy (2 minutes)', description: 'Pick one small area (desk corner, shelf). Put away or throw out 5 items.', iconName: './images/LEISURE-000200000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Decluttering', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000003', category: 'LEISURE', title: 'Mini puzzle', description: 'Do a 2-minute word puzzle (anagram, mini crossword) just for fun.', iconName: './images/LEISURE-000200000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Word_game', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000004', category: 'LEISURE', title: 'Window watch', description: 'Look outside for 2 minutes. Notice movement, light, and weather without judging it.', iconName: './images/LEISURE-000200000004.png', infoUrl: 'https://en.wikipedia.org/wiki/Attention', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000005', category: 'LEISURE', title: 'Tea or water ritual', description: 'Prepare a glass of water or tea slowly. Focus on temperature, smell, and taste.', iconName: './images/LEISURE-000200000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Mindful_eating', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000006', category: 'LEISURE', title: 'Fun fact dive', description: 'Read one short article on a topic you’re curious about. Stop after 5 minutes.', iconName: './images/LEISURE-000200000006.png', infoUrl: 'https://en.wikipedia.org/wiki/Curiosity', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000007', category: 'LEISURE', title: 'Photo: find a texture', description: 'Take a photo of an interesting texture (wood grain, fabric, metal). Look for light and shadows.', iconName: './images/LEISURE-000200000007.png', infoUrl: 'https://en.wikipedia.org/wiki/Texture_(visual_arts)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000008', category: 'LEISURE', title: 'Doodle minute', description: 'Draw shapes for 60–90 seconds. Let your hand move; no goal, no judgment.', iconName: './images/LEISURE-000200000008.png', infoUrl: 'https://en.wikipedia.org/wiki/Doodle', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000009', category: 'LEISURE', title: 'Tiny stretch + music', description: 'Put on a calm track and do gentle neck/shoulder stretches while it plays.', iconName: './images/LEISURE-000200000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Stretching', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000200000010', category: 'LEISURE', title: 'Micro-reading', description: 'Read 2–3 pages of a book (paper or ebook). Stop when the timer ends.', iconName: './images/LEISURE-000200000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Reading', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },

  // SOCIAL (Category 3)
  { id: '000300000001', category: 'SOCIAL', title: 'Gratitude text', description: 'Send a short message to someone: “Thanks for ____.” Keep it simple and specific.', iconName: './images/SOCIAL-000300000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Gratitude', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000002', category: 'SOCIAL', title: 'Check-in question', description: 'Message a friend: “How’s your day going?” Then pause—no need to overthink.', iconName: './images/SOCIAL-000300000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Social_connection', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000003', category: 'SOCIAL', title: 'Voice note hello', description: 'Record a 15–20 second voice note to say hi to someone you trust.', iconName: './images/SOCIAL-000300000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Voice_message', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000004', category: 'SOCIAL', title: 'Compliment practice', description: 'Give a specific compliment to someone nearby or online (about effort, not looks).', iconName: './images/SOCIAL-000300000004.png', infoUrl: 'https://en.wikipedia.org/wiki/Compliment', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000005', category: 'SOCIAL', title: '2-minute listening', description: 'Ask someone a question and listen without interrupting for 2 minutes.', iconName: './images/SOCIAL-000300000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Active_listening', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000006', category: 'SOCIAL', title: 'Share a helpful link', description: 'Send a useful resource to a colleague/friend with one sentence of context.', iconName: './images/SOCIAL-000300000006.png', infoUrl: 'https://en.wikipedia.org/wiki/Knowledge_sharing', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000007', category: 'SOCIAL', title: 'Micro-kindness', description: 'Do one small helpful act (hold a door, reply warmly, refill something).', iconName: './images/SOCIAL-000300000007.png', infoUrl: 'https://en.wikipedia.org/wiki/Prosocial_behavior', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000008', category: 'SOCIAL', title: 'Reconnect list', description: 'Write down 3 people you’d like to reconnect with. Pick one to contact later.', iconName: './images/SOCIAL-000300000008.png', infoUrl: 'https://en.wikipedia.org/wiki/Social_network', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000009', category: 'SOCIAL', title: 'Thank-you to yourself', description: 'Write one sentence recognizing a small win you did today.', iconName: './images/SOCIAL-000300000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Self-affirmation', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000300000010', category: 'SOCIAL', title: 'Plan a mini hangout', description: 'Propose a simple plan: coffee, walk, or call. Keep the invite low pressure.', iconName: './images/SOCIAL-000300000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Friendship', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },

  // MIND (Category 4)
  { id: '000400000001', category: 'MIND', title: 'Box breathing 4-4-4-4', description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 cycles to reset focus.', iconName: './images/MIND-000400000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Box_breathing', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000002', category: 'MIND', title: '5-4-3-2-1 grounding', description: 'Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.', iconName: './images/MIND-000400000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Grounding_(psychology)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000003', category: 'MIND', title: 'One-minute mindfulness', description: 'For 60 seconds, notice your breath. When distracted, gently return to breathing.', iconName: './images/MIND-000400000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Mindfulness', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000004', category: 'MIND', title: 'Brain dump (2 minutes)', description: 'Write everything on your mind. No structure. Stop when the timer ends.', iconName: './images/MIND-000400000004.png', infoUrl: 'https://en.wikipedia.org/wiki/Expressive_writing', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000005', category: 'MIND', title: 'Single-task reset', description: 'Pick one tiny task (open doc, reply to one email). Do only that for 3 minutes.', iconName: './images/MIND-000400000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Multitasking', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000006', category: 'MIND', title: 'Focus intention', description: 'Choose an intention for the next 10 minutes (clarity, calm, speed). Say it once and begin.', iconName: './images/MIND-000400000006.png', infoUrl: 'https://en.wikipedia.org/wiki/Implementation_intention', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000007', category: 'MIND', title: 'Body scan 90 seconds', description: 'Scan from head to toes. Relax the most tense area by softening it on the exhale.', iconName: './images/MIND-000400000007.png', infoUrl: 'https://en.wikipedia.org/wiki/Body_scan_meditation', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000008', category: 'MIND', title: 'Mindful listening', description: 'Listen to nearby and distant sounds for 60–90 seconds. Don’t try to “fix” the soundscape.', iconName: './images/MIND-000400000008.png', infoUrl: 'https://www.mindful.org/mindful-listening/', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000009', category: 'MIND', title: 'Thought labeling', description: 'When a thought appears, label it (plan, worry, memory) and let it pass.', iconName: './images/MIND-000400000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Mindfulness', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000400000010', category: 'MIND', title: 'Visual rest', description: 'Look 20 feet away for 20 seconds. Blink slowly and relax your jaw.', iconName: './images/MIND-000400000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Eye_strain', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },

  // SPIRITUAL (Category 5)
  { id: '000500000001', category: 'SPIRITUAL', title: 'Short prayer or intention', description: 'Take 60 seconds to say a brief prayer or set a heartfelt intention for the day.', iconName: './images/SPIRITUAL-000500000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Prayer', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000002', category: 'SPIRITUAL', title: 'Loving-kindness (mini)', description: 'Repeat silently: “May I be safe. May I be peaceful.” Then extend it to others.', iconName: './images/SPIRITUAL-000500000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Mett%C4%81', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000003', category: 'SPIRITUAL', title: 'Values check', description: 'Ask: “What matters most right now?” Choose one value (care, courage, honesty) and act once.', iconName: './images/SPIRITUAL-000500000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Personal_values', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000004', category: 'SPIRITUAL', title: 'Breath + gratitude', description: 'With each exhale, name one thing you’re grateful for. Do 8 breaths.', iconName: './images/SPIRITUAL-000500000004.png', infoUrl: 'https://en.wikipedia.org/wiki/Gratitude', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000005', category: 'SPIRITUAL', title: 'Nature connection', description: 'If possible, look at a tree/sky. Notice one detail you’ve never noticed before.', iconName: './images/SPIRITUAL-000500000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Biophilia_hypothesis', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000006', category: 'SPIRITUAL', title: 'Mantra 1 minute', description: 'Choose a calming phrase and repeat it slowly for 60 seconds.', iconName: './images/SPIRITUAL-000500000006.png', infoUrl: 'https://en.wikipedia.org/wiki/Mantra', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000007', category: 'SPIRITUAL', title: 'Compassion pause', description: 'Think of someone struggling. Wish them well for 30 seconds. Keep it simple.', iconName: './images/SPIRITUAL-000500000007.png', infoUrl: 'https://en.wikipedia.org/wiki/Compassion', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000008', category: 'SPIRITUAL', title: 'Silence timer', description: 'Sit in silence for 2 minutes. Allow thoughts to come and go without chasing them.', iconName: './images/SPIRITUAL-000500000008.png', infoUrl: 'https://en.wikipedia.org/wiki/Meditation', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000009', category: 'SPIRITUAL', title: 'Meaning note', description: 'Write one sentence: “Today I want to contribute by ____.”', iconName: './images/SPIRITUAL-000500000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Meaning_of_life', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000500000010', category: 'SPIRITUAL', title: 'Forgiveness micro-step', description: 'Identify one small resentment. Try this: “I’m willing to soften this, even a little.”', iconName: './images/SPIRITUAL-000500000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Forgiveness', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },

  // RELAXATION (Category 6)
  { id: '000600000001', category: 'RELAXATION', title: 'Progressive release (hands)', description: 'Clench fists 5s, release 10s. Repeat 3 times. Notice warmth and relaxation.', iconName: './images/RELAXATION-000600000001.png', infoUrl: 'https://en.wikipedia.org/wiki/Progressive_muscle_relaxation', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000002', category: 'RELAXATION', title: 'Shoulder drop', description: 'Lift shoulders to ears, hold 2s, then drop. Repeat 8 times with slow breathing.', iconName: './images/RELAXATION-000600000002.png', infoUrl: 'https://en.wikipedia.org/wiki/Relaxation_technique', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000003', category: 'RELAXATION', title: 'Jaw & face relax', description: 'Unclench jaw, relax tongue, soften forehead. Hold for 30 seconds while breathing slowly.', iconName: './images/RELAXATION-000600000003.png', infoUrl: 'https://en.wikipedia.org/wiki/Bruxism', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000004', category: 'RELAXATION', title: '4-7-8 breathing', description: 'Inhale 4s, hold 7s, exhale 8s. Do 4 cycles. Stop if you feel dizzy.', iconName: './images/RELAXATION-000600000004.png', infoUrl: 'https://en.wikipedia.org/wiki/4-7-8_breathing', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000005', category: 'RELAXATION', title: 'Warm drink pause', description: 'Hold a warm mug and feel the heat in your hands. Take 3 slow sips.', iconName: './images/RELAXATION-000600000005.png', infoUrl: 'https://en.wikipedia.org/wiki/Mindfulness', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000006', category: 'RELAXATION', title: 'Mini stretch: neck', description: 'Tilt head right 20s, left 20s. Breathe out longer than you breathe in.', iconName: './images/RELAXATION-000600000006.png', infoUrl: 'https://www.nhs.uk/live-well/exercise/flexibility-exercises/', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000007', category: 'RELAXATION', title: 'Slow exhale', description: 'Inhale 3s, exhale 6s. Do 10 breaths. Focus on the long exhale.', iconName: './images/RELAXATION-000600000007.png', infoUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6137615/', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000008', category: 'RELAXATION', title: 'Feet on floor', description: 'Sit and press feet into the floor for 10 seconds, then release. Repeat 5 times.', iconName: './images/RELAXATION-000600000008.png', infoUrl: 'https://en.wikipedia.org/wiki/Grounding_(psychology)', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000009', category: 'RELAXATION', title: 'Calm gaze', description: 'Pick a point and softly focus for 60 seconds. Blink slowly and relax your shoulders.', iconName: './images/RELAXATION-000600000009.png', infoUrl: 'https://en.wikipedia.org/wiki/Tr%C4%81%E1%B9%ADaka', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' },
  { id: '000600000010', category: 'RELAXATION', title: 'No-screen minute', description: 'Put the phone face down and do nothing for 60 seconds. Let your nervous system settle.', iconName: './images/RELAXATION-000600000010.png', infoUrl: 'https://en.wikipedia.org/wiki/Attention_restoration_theory', thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null, creatorId: '1', creatorName: 'admin' }
];

// --- HELPER: LOCAL STORAGE WRAPPERS ---

const getLocal = <T>(key: string, defaultVal: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocal = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// --- USER & SETTINGS ---

export const getProfile = async (): Promise<UserProfile> => {
  // Try Supabase first, fallback to local storage
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
      // Logic to get profile from Supabase would go here
      // For now, we return default if backend table is missing or just rely on localStorage
  }
  return getLocal<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
};

export const getSettings = async (): Promise<UserSettings> => {
    return getLocal<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
};

export const saveProfile = async (profile: UserProfile) => {
  setLocal(STORAGE_KEYS.PROFILE, profile);
  // Also try to sync with Supabase if logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: profile.email,
        first_name: profile.firstName,
        surname: profile.surname,
        family_name: profile.familyName,
        avatar_url: profile.avatarUrl,
        country: profile.country,
        timezone: profile.timezone,
        login_dates: profile.loginDates
      });
  }
};

export const saveSettings = async (settings: UserSettings) => {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    // Also try to sync with Supabase if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('profiles').update({ settings: settings }).eq('id', user.id);
    }
};

// --- ACTIVITIES ---

export const getActivities = async (): Promise<Activity[]> => {
  // 1. Get Custom Activities
  const customActivities = getLocal<Activity[]>(STORAGE_KEYS.CUSTOM_ACTIVITIES, []);
  
  // 2. Get States (votes/timestamps) for Defaults
  const activityStates = getLocal<Record<string, Partial<Activity>>>(STORAGE_KEYS.ACTIVITY_STATES, {});

  // 3. Merge Defaults with States
  const mergedDefaults = DEFAULT_ACTIVITIES.map(act => {
      const state = activityStates[act.id];
      if (state) {
          return { ...act, ...state };
      }
      return act;
  });

  return [...mergedDefaults, ...customActivities];
};

export const createActivity = async (newActivity: Activity) => {
  const currentCustom = getLocal<Activity[]>(STORAGE_KEYS.CUSTOM_ACTIVITIES, []);
  const updatedCustom = [...currentCustom, newActivity];
  setLocal(STORAGE_KEYS.CUSTOM_ACTIVITIES, updatedCustom);
  
  // Sync to Supabase if possible
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
      await supabase.from('activities').insert({
          category: newActivity.category,
          title: newActivity.title,
          description: newActivity.description,
          icon_name: newActivity.iconName,
          info_url: newActivity.infoUrl,
          created_by: user.id,
          is_public: false
      });
  }
};

export const getAllCategories = async (): Promise<string[]> => {
    const activities = await getActivities();
    const categories = new Set(DEFAULT_CATEGORIES);
    activities.forEach(a => categories.add(a.category));
    return Array.from(categories);
};

// --- LOGS ---

export const getLogs = async (): Promise<LogEntry[]> => {
    return getLocal<LogEntry[]>(STORAGE_KEYS.LOGS, []);
};

export const addLog = async (log: Omit<LogEntry, 'id'>) => {
    const newLog: LogEntry = { ...log, id: Date.now().toString() }; // Generate ID locally
    const currentLogs = getLocal<LogEntry[]>(STORAGE_KEYS.LOGS, []);
    const updatedLogs = [newLog, ...currentLogs];
    setLocal(STORAGE_KEYS.LOGS, updatedLogs);

    // Sync to Supabase if possible
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('logs').insert({
            user_id: user.id,
            activity_id: log.activityId,
            type: log.type,
            category: log.category,
            activity_name: log.activityName,
            duration: log.duration,
            timestamp: new Date(log.timestamp).toISOString()
        });
    }
};

// --- STATS HELPER ---

export const recordAppOpen = async () => {
    const profile = await getProfile();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (!profile.loginDates) profile.loginDates = [];
    if (!profile.loginDates.includes(dateStr)) {
      profile.loginDates.push(dateStr);
      await saveProfile(profile);
    }
};

// --- ALGORITHM (Updated) ---

export const selectNextActivity = async (settings: UserSettings): Promise<Activity | null> => {
  const allActivities = await getActivities();
  const logs = await getLogs();
  
  // 1. Filter by enabled categories
  let candidates = allActivities.filter(a => settings.visibleCategories.includes(a.category));
  if (candidates.length === 0) return null;

  // 2. Calculate weights
  const weightedCandidates = candidates.map(activity => {
    let weight = 1.0;
    
    // Preference weight
    const multiplier = (1 + activity.thumbsUpCount) / (1 + activity.thumbsDownCount);
    weight *= multiplier;

    // Anti-repetition: Last 3 breaks
    const recentBreakLogs = logs
      .filter(l => l.type === 'happypause_started')
      .slice(0, 3);
    
    if (recentBreakLogs.some(l => l.activityId === activity.id)) {
      weight *= 0.25;
    }

    // Anti-repetition: Within 2 hours
    if (activity.lastShownAt && (Date.now() - activity.lastShownAt) < 2 * 60 * 60 * 1000) {
      weight *= 0.5;
    }

    // Min weight
    if (weight < 0.05) weight = 0.05;

    return { activity, weight };
  });

  // 3. Weighted Random Selection
  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of weightedCandidates) {
    random -= item.weight;
    if (random <= 0) {
      return item.activity;
    }
  }

  return weightedCandidates[0].activity;
};

// Updates activity feedback based on specific actions (increment/decrement)
export const updateActivityFeedback = async (id: string, type: 'increment_up' | 'decrement_up' | 'increment_down' | 'decrement_down' | 'shown') => {
    // 1. Update Local State Storage
    const activityStates = getLocal<Record<string, Partial<Activity>>>(STORAGE_KEYS.ACTIVITY_STATES, {});
    const currentState = activityStates[id] || { thumbsUpCount: 0, thumbsDownCount: 0, lastShownAt: null };

    if (type === 'shown') {
        currentState.lastShownAt = Date.now();
    } else if (type === 'increment_up') {
        currentState.thumbsUpCount = (currentState.thumbsUpCount || 0) + 1;
    } else if (type === 'decrement_up') {
        currentState.thumbsUpCount = Math.max(0, (currentState.thumbsUpCount || 0) - 1);
    } else if (type === 'increment_down') {
        currentState.thumbsDownCount = (currentState.thumbsDownCount || 0) + 1;
    } else if (type === 'decrement_down') {
        currentState.thumbsDownCount = Math.max(0, (currentState.thumbsDownCount || 0) - 1);
    }

    activityStates[id] = currentState;
    setLocal(STORAGE_KEYS.ACTIVITY_STATES, activityStates);

    // 2. Also update Custom Activities list if it's a custom one (optimization)
    const customActivities = getLocal<Activity[]>(STORAGE_KEYS.CUSTOM_ACTIVITIES, []);
    const customIndex = customActivities.findIndex(a => a.id === id);
    if (customIndex >= 0) {
        customActivities[customIndex] = { ...customActivities[customIndex], ...currentState };
        setLocal(STORAGE_KEYS.CUSTOM_ACTIVITIES, customActivities);
    }

    // 3. Sync to Supabase if possible
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const updates: any = {};
        if (type === 'shown') updates.last_shown_at = new Date().toISOString();
        // Increment/Decrement logic for SQL is handled better via RPC or raw query, 
        // but for simple sync we can just send the new value if we fetched the fresh one. 
        // This is a simplified version.
    }
};