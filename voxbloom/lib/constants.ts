import { Avatar, Badge } from '@/types';

export const AVATARS: Avatar[] = [
  { id: 'bear', name: 'Bear', emoji: '🐻', bgColor: 'bg-amber-100' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', bgColor: 'bg-pink-100' },
  { id: 'fox', name: 'Fox', emoji: '🦊', bgColor: 'bg-orange-100' },
  { id: 'cat', name: 'Cat', emoji: '🐱', bgColor: 'bg-purple-100' },
  { id: 'dog', name: 'Dog', emoji: '🐶', bgColor: 'bg-blue-100' },
  { id: 'panda', name: 'Panda', emoji: '🐼', bgColor: 'bg-gray-100' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', bgColor: 'bg-yellow-100' },
  { id: 'elephant', name: 'Elephant', emoji: '🐘', bgColor: 'bg-slate-100' },
  { id: 'owl', name: 'Owl', emoji: '🦉', bgColor: 'bg-amber-100' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', bgColor: 'bg-cyan-100' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', bgColor: 'bg-indigo-100' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', bgColor: 'bg-fuchsia-100' },
];

export const DEFAULT_BADGES: Badge[] = [
  { id: 'first-exercise', name: 'First Steps', description: 'Complete your first exercise', icon: '🌱', unlockedAt: null },
  { id: 'five-streak', name: 'On Fire!', description: 'Reach a 5-day streak', icon: '🔥', unlockedAt: null },
  { id: 'ten-sounds', name: 'Sound Explorer', description: 'Master 10 different sounds', icon: '🎵', unlockedAt: null },
  { id: 'jungle-complete', name: 'Jungle Master', description: 'Complete all Jungle levels', icon: '🌴', unlockedAt: null },
  { id: 'word-garden-50', name: 'Word Gardener', description: 'Grow 50 words in your garden', icon: '🌻', unlockedAt: null },
  { id: 'level-5', name: 'Rising Star', description: 'Reach Level 5', icon: '⭐', unlockedAt: null },
  { id: 'tongue-gym-pro', name: 'Tongue Gymnast', description: 'Complete 20 tongue exercises', icon: '💪', unlockedAt: null },
  { id: 'all-modules', name: 'Knowledge Seeker', description: 'Complete all learning modules', icon: '📚', unlockedAt: null },
];

export const XP_PER_LEVEL = 100;

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇲🇽' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
] as const;

export const GAME_CONFIGS = {
  'story-studio': {
    name: 'Story Studio',
    description: 'Role-play fun scenarios while an AI friend helps you practice!',
    icon: '🎭',
    color: 'from-violet-400 to-fuchsia-500',
    bgColor: 'bg-violet-50',
    scenarios: ['Restaurant', 'Park', 'School', 'Space Adventure'],
  },
  'sound-safari': {
    name: 'Sound Safari',
    description: 'Explore environments and collect animals by saying sounds correctly!',
    icon: '🦁',
    color: 'from-green-400 to-emerald-600',
    bgColor: 'bg-green-50',
    environments: ['Jungle', 'Ocean', 'Mountain', 'Space', 'Farm', 'Arctic'],
  },
  'word-garden': {
    name: 'Word Garden',
    description: 'Grow a beautiful garden by learning new words!',
    icon: '🌻',
    color: 'from-pink-400 to-purple-500',
    bgColor: 'bg-pink-50',
    categories: ['Animals', 'Food', 'Family', 'Colors', 'Actions', 'Feelings', 'Nature', 'Body', 'Vehicles', 'School'],
  },
  'rhythm-river': {
    name: 'Rhythm River',
    description: 'Float down the river and practice speaking with rhythm!',
    icon: '🌊',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    levels: 4,
  },
  'emotion-echo': {
    name: 'Emotion Echo',
    description: 'Listen to voices and match the emotions you hear!',
    icon: '🎪',
    color: 'from-rose-400 to-amber-500',
    bgColor: 'bg-rose-50',
    levels: 3,
  },
  'tongue-gym': {
    name: 'Tongue Gym',
    description: 'Fun workouts for your tongue, lips, and jaw!',
    icon: '💪',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    exercises: ['Tongue Push-Ups', 'Lip Stretches', 'Cheek Puffs', 'Tongue Circles', 'Jaw Slides'],
  },
  'reader': {
    name: 'Reader',
    description: 'Read aloud from any text or PDF — one word at a time!',
    icon: '📖',
    color: 'from-sky-400 to-teal',
    bgColor: 'bg-sky-50',
  },
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/screening', label: 'Screening' },
  { href: '/learn', label: 'Learn' },
  { href: '/play', label: 'Play' },
  { href: '/daily-challenge', label: 'Daily Challenge' },
  { href: '/profile', label: 'Profile' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clinician', label: 'Clinician' },
  { href: '/settings', label: 'Settings' },
  { href: '/find-help', label: 'Find Help' },
  { href: '/about', label: 'About' },
] as const;

/* ------------------------------------------------------------------ */
/*  Mouth placement hints for Dynamic Assessment (Stimulability)       */
/* ------------------------------------------------------------------ */

export const MOUTH_HINTS: Record<string, { tip: string; emoji: string }> = {
  p: { tip: 'Press your lips together, then pop them open with a puff of air!', emoji: '💨' },
  b: { tip: 'Press your lips together and hum, then let the sound burst out!', emoji: '💥' },
  m: { tip: 'Close your lips gently and hum through your nose: mmmmm!', emoji: '😊' },
  d: { tip: 'Touch the tip of your tongue right behind your top teeth and let go!', emoji: '🔤' },
  n: { tip: 'Put your tongue tip behind your top teeth and hum through your nose!', emoji: '👃' },
  t: { tip: 'Tap the tip of your tongue behind your top teeth quickly!', emoji: '👆' },
  k: { tip: 'Push the back of your tongue up against the roof of your mouth!', emoji: '🏔️' },
  g: { tip: 'Like /k/, but add your voice. Feel the buzz in your throat!', emoji: '🐝' },
  f: { tip: 'Gently bite your bottom lip and blow air out softly!', emoji: '🌬️' },
  v: { tip: 'Like /f/, but add your voice. Feel the buzz on your lip!', emoji: '⚡' },
  s: { tip: 'Keep your teeth close together and blow air out gently like a snake!', emoji: '🐍' },
  z: { tip: 'Like /s/, but add your voice. Feel the buzzing!', emoji: '🐝' },
  sh: { tip: 'Round your lips and push air out quietly, like a librarian: shhh!', emoji: '🤫' },
  ch: { tip: 'Start with your tongue on the roof like /t/, then slide to /sh/!', emoji: '🚂' },
  th: { tip: 'Stick your tongue tip gently between your teeth and blow!', emoji: '😛' },
  r: { tip: 'Curl the tip of your tongue up and back without touching the roof!', emoji: '🏴‍☠️' },
  l: { tip: 'Press the tip of your tongue behind your top teeth and let air flow around the sides!', emoji: '🎵' },
  w: { tip: 'Round your lips into a small circle and then slide them open!', emoji: '🫧' },
  j: { tip: 'Smile and slide your tongue from the roof of your mouth!', emoji: '😄' },
  h: { tip: 'Open your mouth and breathe out gently, like fogging a mirror!', emoji: '🪞' },
};

/* ------------------------------------------------------------------ */
/*  International resources for globalized Find Help                    */
/* ------------------------------------------------------------------ */

export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'OTHER', name: 'Other Country', flag: '🌍' },
] as const;

export const INTERNATIONAL_RESOURCES = [
  {
    name: 'ASHA ProFind',
    description: 'Official directory of certified speech-language pathologists in the United States.',
    url: 'https://find.asha.org',
    icon: '🏥',
    countries: ['US'],
  },
  {
    name: 'Royal College of Speech & Language Therapists',
    description: 'Find a registered speech and language therapist in the United Kingdom.',
    url: 'https://www.rcslt.org/finding-help/',
    icon: '🇬🇧',
    countries: ['GB', 'IE'],
  },
  {
    name: 'Speech Pathology Australia',
    description: 'Find a certified speech pathologist in Australia and New Zealand.',
    url: 'https://www.speechpathologyaustralia.org.au/find-a-speech-pathologist',
    icon: '🦘',
    countries: ['AU', 'NZ'],
  },
  {
    name: 'Speech-Language & Audiology Canada',
    description: 'Find speech-language pathologists and audiologists across Canada.',
    url: 'https://www.sac-oac.ca/find-a-professional/',
    icon: '🍁',
    countries: ['CA'],
  },
  {
    name: 'Indian Speech and Hearing Association',
    description: 'Directory of speech-language pathologists and audiologists in India.',
    url: 'https://www.ishaindia.org.in/',
    icon: '🇮🇳',
    countries: ['IN', 'BD'],
  },
  {
    name: 'South African Speech-Language-Hearing Association',
    description: 'Find registered speech therapists across South Africa.',
    url: 'https://www.saslha.co.za/',
    icon: '🇿🇦',
    countries: ['ZA'],
  },
  {
    name: 'IALP Global Directory',
    description: 'International Association of Logopedics and Phoniatrics: global directory of speech professionals.',
    url: 'https://www.ialp.info/',
    icon: '🌍',
    countries: [],
  },
  {
    name: 'WHO Early Childhood Resources',
    description: 'World Health Organization resources on childhood development and early intervention worldwide.',
    url: 'https://www.who.int/initiatives/improving-early-childhood-development-with-words-not-walls',
    icon: '🏛️',
    countries: [],
  },
  {
    name: 'Global Telehealth SLP Services',
    description: 'Many certified speech-language pathologists offer virtual sessions internationally. A great option if no local SLPs are available.',
    url: 'https://www.asha.org/practice/telepractice/',
    icon: '💻',
    countries: [],
  },
] as const;
