'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Edit3, User, Users, Baby } from 'lucide-react';
import { toast } from 'sonner';
import { FlowPaths } from '@/components/ui/background-patterns';
import { useAppStore } from '@/lib/store';
import { AVATARS, LANGUAGES } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { MagneticButton } from '@/components/ui/MagneticButton';

const STEPS = ['Role', 'Name', 'Age', 'Avatar', 'Language'];

const SPEECH_CONCERNS = [
  'Articulation',
  'Stuttering',
  'Language Delay',
  'Social Communication',
  'Voice Clarity',
];

/* ========== Staggered Section Wrapper ========== */

function StaggeredSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ========== Main Page Component ========== */

export default function ProfilePage() {
  const { t } = useTranslation();
  const { profile, setProfile } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState(1);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [gender, setGender] = useState<string>('');

  useEffect(() => {
    if (profile && isEditing) {
      setRole(profile.userRole || 'child');
      setName(profile.name);
      setAge(profile.age);
      setSelectedAvatar(profile.avatarId);
      setSelectedLanguage(profile.language);
    }
  }, [profile, isEditing]);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return role !== null;
      case 1:
        return name.trim().length >= 1;
      case 2:
        return age !== null;
      case 3:
        return selectedAvatar !== '';
      case 4:
        return selectedLanguage !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (age === null || role === null) return;
    setProfile({
      name: name.trim(),
      age,
      avatarId: selectedAvatar,
      language: selectedLanguage as 'en' | 'es' | 'hi' | 'af' | 'bn' | 'tl',
      createdAt: profile?.createdAt || new Date().toISOString(),
      userRole: role,
    });
    setIsComplete(true);
    setIsEditing(false);
    toast.success('Profile saved', { description: `Welcome, ${name.trim() || 'friend'}!` });
    setTimeout(() => setIsComplete(false), 3000);
  };

  const startWizard = () => {
    setIsEditing(true);
    setCurrentStep(0);
    setIsComplete(false);
  };

  const avatarData = profile ? AVATARS.find((a) => a.id === profile.avatarId) : null;
  const selectedAvatarData = AVATARS.find((a) => a.id === selectedAvatar);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  };

  // Show existing profile view
  if (profile && !isEditing) {
    return (
      <div className="min-h-screen bg-cream">
        {/* Film grain */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
          <svg width="100%" height="100%">
            <filter id="grain-profile-view">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-profile-view)" />
          </svg>
        </div>

        <AnimatePresence>
          {isComplete && <CelebrationOverlay />}
        </AnimatePresence>

        <div className="max-w-[640px] mx-auto px-6 py-24">
          {/* Header */}
          <StaggeredSection delay={0}>
            <div className="text-center mb-12 space-y-4">
              <h1 className="font-heading italic text-4xl md:text-5xl tracking-tight text-navy">
                {profile.name}
              </h1>
              <p className="text-muted font-body">
                {profile.age} {t('profile.yearsOld')}
              </p>
            </div>
          </StaggeredSection>

          {/* Avatar showcase */}
          <StaggeredSection delay={0.1}>
            <div className="flex justify-center mb-10">
              <div
                className={`w-28 h-28 ${avatarData?.bgColor || 'bg-ice'} rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-4 ring-white`}
              >
                <span className="text-6xl">{avatarData?.emoji || '?'}</span>
              </div>
            </div>
          </StaggeredSection>

          {/* Detail rows */}
          <StaggeredSection delay={0.2}>
            <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden mb-10">
              <div className="divide-y divide-ice">
                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center">
                      <span className="text-xl">{avatarData?.emoji}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-body">{t('profile.avatar')}</p>
                      <p className="font-heading italic text-navy">{avatarData?.name}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>

                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center">
                      <span className="text-xl">
                        {LANGUAGES.find((l) => l.code === profile.language)?.flag}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-body">{t('profile.language')}</p>
                      <p className="font-heading italic text-navy">
                        {LANGUAGES.find((l) => l.code === profile.language)?.name}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>

                <div className="flex items-center justify-between px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-teal/10 flex items-center justify-center">
                      {profile.userRole === 'parent' ? (
                        <Users size={18} className="text-teal" />
                      ) : (
                        <Baby size={18} className="text-teal" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted font-body">Role</p>
                      <p className="font-heading italic text-navy capitalize">
                        {profile.userRole}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </div>
            </div>
          </StaggeredSection>

          <StaggeredSection delay={0.3} className="flex justify-center">
            <MagneticButton
              onClick={startWizard}
              className="bg-teal text-white font-body font-semibold py-3.5 px-8 rounded-xl inline-flex items-center gap-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
            >
              <Edit3 size={18} />
              {t('profile.editProfile')}
            </MagneticButton>
          </StaggeredSection>
        </div>
      </div>
    );
  }

  // Wizard view
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 text-teal opacity-[0.13] pointer-events-none z-0">
        <FlowPaths />
      </div>
      {/* Film grain */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
        <svg width="100%" height="100%">
          <filter id="grain-profile-wizard">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-profile-wizard)" />
        </svg>
      </div>

      <AnimatePresence>
        {isComplete && <CelebrationOverlay />}
      </AnimatePresence>

      <div className="max-w-[640px] mx-auto px-6 pt-8 pb-16">
        {/* Hero Header */}
        <StaggeredSection delay={0}>
          <div className="text-center mb-12 space-y-4">
            <h1 className="font-heading italic text-4xl md:text-5xl tracking-tight text-navy">
              {isEditing && profile ? t('profile.editProfile') : t('profile.createYourProfile')}
            </h1>
            <p className="text-muted font-body max-w-md mx-auto">
              {t('profile.getToKnow')}
            </p>
          </div>
        </StaggeredSection>

        {/* Main Form Card */}
        <StaggeredSection delay={0.1}>
          <div className="w-full bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 md:p-12 relative">
            {/* Decorative background blur */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-teal/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-3 mb-10">
                {STEPS.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: index === currentStep ? 1.15 : 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-500 ${
                        index < currentStep
                          ? 'bg-success text-white'
                          : index === currentStep
                          ? 'bg-teal text-white'
                          : 'bg-ice text-muted'
                      }`}
                    >
                      {index < currentStep ? (
                        <Check size={14} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </motion.div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`w-8 h-0.5 transition-colors duration-500 ${
                          index < currentStep ? 'bg-success' : 'bg-ice'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Avatar Preview — shown on avatar step */}
              {currentStep === 3 && selectedAvatarData && (
                <motion.div
                  className="flex justify-center mb-8"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <div
                    className={`w-24 h-24 ${selectedAvatarData.bgColor} rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.06)] ring-4 ring-white`}
                  >
                    <span className="text-5xl">{selectedAvatarData.emoji}</span>
                  </div>
                </motion.div>
              )}

              {/* Step Content */}
              <div className="min-h-[320px] overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    initial={{ x: direction * 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction * -200, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {currentStep === 0 && (
                      <RoleStep role={role} setRole={setRole} />
                    )}
                    {currentStep === 1 && (
                      <NameStep name={name} setName={setName} role={role} gender={gender} setGender={setGender} />
                    )}
                    {currentStep === 2 && (
                      <AgeStep age={age} setAge={setAge} role={role} selectedConcerns={selectedConcerns} toggleConcern={toggleConcern} />
                    )}
                    {currentStep === 3 && (
                      <AvatarStep
                        selectedAvatar={selectedAvatar}
                        setSelectedAvatar={setSelectedAvatar}
                      />
                    )}
                    {currentStep === 4 && (
                      <LanguageStep
                        selectedLanguage={selectedLanguage}
                        setSelectedLanguage={setSelectedLanguage}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-ice">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 py-3 px-5 rounded-xl font-body font-semibold text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-500 cursor-pointer"
                >
                  <ChevronLeft size={18} />
                  {t('common.back')}
                </button>
                <MagneticButton
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-teal text-white font-body font-semibold py-3.5 px-8 rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500"
                >
                  {currentStep === STEPS.length - 1 ? (
                    <>
                      {t('profile.complete')}
                      <Check size={18} />
                    </>
                  ) : (
                    <>
                      {t('common.next')}
                      <ChevronRight size={18} />
                    </>
                  )}
                </MagneticButton>
              </div>

              {/* Privacy notice */}
              <div className="flex items-center justify-center gap-2 text-muted text-xs mt-6">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p className="font-body tracking-tight">All data stays on your device. No signup required.</p>
              </div>
            </div>
          </div>
        </StaggeredSection>
      </div>
    </div>
  );
}

/* ========== Step Components ========== */

function RoleStep({
  role,
  setRole,
}: {
  role: 'parent' | 'child' | null;
  setRole: (v: 'parent' | 'child') => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h2 className="font-heading italic text-2xl text-navy mb-2">
        {t('profile.whoUsing')}
      </h2>
      <p className="text-muted mb-8 font-body">
        {t('profile.whoUsingDesc')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
        <motion.button
          whileHover={{ y: -2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onClick={() => setRole('parent')}
          className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-500 cursor-pointer ${
            role === 'parent'
              ? 'bg-teal/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
              : 'bg-ice hover:bg-teal/5'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${
            role === 'parent' ? 'bg-teal/15' : 'bg-white'
          }`}>
            <Users size={28} className={role === 'parent' ? 'text-teal' : 'text-muted'} />
          </div>
          <span className="font-heading italic font-bold text-navy">{t('profile.parentCaregiver')}</span>
          <span className="text-xs text-muted font-body">
            {t('profile.parentDesc')}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ y: -2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onClick={() => setRole('child')}
          className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all duration-500 cursor-pointer ${
            role === 'child'
              ? 'bg-teal/5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
              : 'bg-ice hover:bg-teal/5'
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-500 ${
            role === 'child' ? 'bg-teal/15' : 'bg-white'
          }`}>
            <Baby size={28} className={role === 'child' ? 'text-teal' : 'text-muted'} />
          </div>
          <span className="font-heading italic font-bold text-navy">{t('profile.iAmChild')}</span>
          <span className="text-xs text-muted font-body">
            {t('profile.childDesc')}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

function NameStep({
  name,
  setName,
  role,
  gender,
  setGender,
}: {
  name: string;
  setName: (v: string) => void;
  role: 'parent' | 'child' | null;
  gender: string;
  setGender: (v: string) => void;
}) {
  const { t } = useTranslation();
  const isParent = role === 'parent';
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading italic text-2xl text-navy mb-2">
          {isParent ? t('profile.childNameQ') : t('profile.yourNameQ')}
        </h2>
        <p className="text-muted mb-6 font-body">
          {isParent ? t('profile.childNameDesc') : t('profile.yourNameDesc')}
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-muted font-body">
          Child&apos;s Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isParent ? t('profile.childNamePlaceholder') : t('profile.yourNamePlaceholder')}
          maxLength={30}
          className="w-full px-6 py-4 rounded-xl bg-white dark:bg-white/5 border border-navy/20 dark:border-white/15 text-navy dark:text-white font-body placeholder:text-muted/40 focus:ring-2 focus:ring-teal/40 focus:border-teal/50 focus:outline-none transition-all duration-300"
          autoFocus
        />
      </div>

      {/* Gender toggle */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-muted font-body">
          Gender Selection
        </label>
        <div className="flex flex-wrap gap-3">
          {['Boy', 'Girl', 'Prefer not to say'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-body font-medium text-sm transition-all duration-500 cursor-pointer ${
                gender === g
                  ? 'bg-teal/10 text-teal'
                  : 'bg-ice text-muted hover:bg-teal/5'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgeStep({
  age,
  setAge,
  role,
  selectedConcerns,
  toggleConcern,
}: {
  age: number | null;
  setAge: (v: number) => void;
  role: 'parent' | 'child' | null;
  selectedConcerns: string[];
  toggleConcern: (concern: string) => void;
}) {
  const { t } = useTranslation();
  const isParent = role === 'parent';
  const [manualAge, setManualAge] = useState(age?.toString() || '');
  const sliderValue = age ?? 5;

  const handleSlider = (val: number) => {
    setAge(val);
    setManualAge(val.toString());
  };

  const handleManualInput = (val: string) => {
    setManualAge(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 18) {
      setAge(parsed);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading italic text-2xl text-navy mb-2">
          {isParent ? t('profile.childAgeQ') : t('profile.yourAgeQ')}
        </h2>
        <p className="text-muted mb-6 font-body">
          {isParent ? t('profile.childAgeDesc') : t('profile.yourAgeDesc')}
        </p>
      </div>

      {/* Age display + slider */}
      <div className="text-center">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-muted font-body">Age Range</label>
          <span className="text-teal font-bold bg-teal/10 px-3 py-1 rounded-full text-xs font-body">
            {age ?? '?'} Years Old
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={12}
          value={sliderValue}
          onChange={(e) => handleSlider(parseInt(e.target.value))}
          className="w-full h-2 bg-ice rounded-full appearance-none cursor-pointer accent-teal"
        />
        <div className="flex justify-between text-[10px] text-muted px-1 font-bold mt-1 font-body">
          <span>2 YEARS</span>
          <span>12 YEARS</span>
        </div>
      </div>

      {/* Manual input */}
      <div className="max-w-[120px] mx-auto">
        <label className="block text-xs text-muted mb-1 font-body text-center">{t('profile.orTypeAge')}</label>
        <input
          type="number"
          min={1}
          max={18}
          value={manualAge}
          onChange={(e) => handleManualInput(e.target.value)}
          placeholder="Age"
          className="w-full text-center text-lg font-heading italic font-semibold text-navy rounded-xl py-2 px-3 bg-ice border-none focus:ring-2 focus:ring-teal/30 focus:outline-none transition-all duration-500"
        />
      </div>

      {/* Speech Concerns Tags */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-muted font-body">
          Speech Concerns
        </label>
        <div className="flex flex-wrap gap-2">
          {SPEECH_CONCERNS.map((concern) => (
            <button
              key={concern}
              type="button"
              onClick={() => toggleConcern(concern)}
              className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all duration-500 cursor-pointer ${
                selectedConcerns.includes(concern)
                  ? 'bg-coral/15 text-coral'
                  : 'bg-ice text-muted hover:bg-teal/5 hover:text-teal'
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AvatarStep({
  selectedAvatar,
  setSelectedAvatar,
}: {
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h2 className="font-heading italic text-2xl text-navy mb-2">
        {t('profile.chooseBuddy')}
      </h2>
      <p className="text-muted mb-2 font-body">
        {t('profile.chooseBuddyDesc')}
      </p>
      <label className="block text-xs font-semibold tracking-widest uppercase text-muted mb-6 font-body">
        Choose an Avatar
      </label>

      {/* Horizontal scroll row of small avatars */}
      <div className="flex justify-center items-center gap-3 overflow-x-auto pb-4">
        {AVATARS.map((avatar) => (
          <motion.button
            key={avatar.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={() => setSelectedAvatar(avatar.id)}
            className={`flex-shrink-0 w-14 h-14 rounded-full p-0.5 transition-all duration-500 cursor-pointer ${
              selectedAvatar === avatar.id
                ? 'ring-2 ring-teal ring-offset-2 ring-offset-white'
                : 'hover:ring-2 hover:ring-teal/30 hover:ring-offset-2 hover:ring-offset-white'
            }`}
          >
            <div
              className={`w-full h-full ${avatar.bgColor} rounded-full flex items-center justify-center`}
            >
              <span className="text-2xl">{avatar.emoji}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected avatar name */}
      {selectedAvatar && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-sm font-body text-muted mt-2"
        >
          {AVATARS.find((a) => a.id === selectedAvatar)?.name}
        </motion.p>
      )}
    </div>
  );
}

function LanguageStep({
  selectedLanguage,
  setSelectedLanguage,
}: {
  selectedLanguage: string;
  setSelectedLanguage: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="font-heading italic text-2xl text-navy mb-2">
          {t('profile.pickLanguage')}
        </h2>
        <p className="text-muted font-body">
          {t('profile.pickLanguageDesc')}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-muted font-body">
          Primary Language
        </label>
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-6 py-4 rounded-xl bg-ice border-none text-navy font-body appearance-none focus:ring-2 focus:ring-teal/30 focus:outline-none transition-all duration-500 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <ChevronRight
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted rotate-90"
          />
        </div>
      </div>

      {/* Also show as buttons for quick selection */}
      <div className="flex flex-col gap-2 mt-6">
        {LANGUAGES.map((lang) => (
          <motion.button
            key={lang.code}
            whileHover={{ y: -1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={() => setSelectedLanguage(lang.code)}
            className={`flex items-center gap-4 py-3.5 px-5 rounded-xl text-left transition-all duration-500 cursor-pointer ${
              selectedLanguage === lang.code
                ? 'bg-teal text-white'
                : 'bg-ice text-navy hover:bg-teal/5'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="font-body font-semibold">{lang.name}</span>
            {selectedLanguage === lang.code && (
              <Check size={16} className="ml-auto" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ========== Celebration Overlay ========== */

function CelebrationOverlay() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/20 backdrop-blur-sm"
    >
      {/* Center Message */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-10 text-center z-10 max-w-sm mx-4"
      >
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={40} className="text-success" />
        </div>
        <h2 className="font-heading italic text-2xl text-navy mb-2">
          {t('profile.profileComplete')}
        </h2>
        <p className="text-muted font-body">{t('profile.readyToBloom')}</p>
      </motion.div>
    </motion.div>
  );
}
