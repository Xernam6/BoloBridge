'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mic,
  BookOpen,
  Gamepad2,
  Zap,
  BarChart3,
  User,
  Settings,
  Info,
  MapPin,
  GraduationCap,
  Stethoscope,
  X,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: string;
}

const COMMANDS: CommandItem[] = [
  // Core
  { id: 'home', label: 'Home', description: 'Landing page', icon: <Search size={16} />, href: '/', category: 'Navigate' },
  { id: 'screening', label: 'Speech Screening', description: 'Run a triage-level assessment', icon: <Stethoscope size={16} />, href: '/screening', category: 'Navigate' },
  { id: 'play', label: 'Play Games', description: 'All 6 speech exercise games', icon: <Gamepad2 size={16} />, href: '/play', category: 'Navigate' },
  { id: 'learn', label: 'Learn', description: '22 educational modules', icon: <BookOpen size={16} />, href: '/learn', category: 'Navigate' },
  { id: 'daily', label: 'Daily Challenge', description: '5-minute mixed practice', icon: <Zap size={16} />, href: '/daily-challenge', category: 'Navigate' },
  { id: 'dashboard', label: 'Parent Dashboard', description: 'Progress, analytics, and badges', icon: <BarChart3 size={16} />, href: '/dashboard', category: 'Navigate' },
  { id: 'profile', label: 'Profile', description: 'Name, age, avatar, language', icon: <User size={16} />, href: '/profile', category: 'Navigate' },
  { id: 'clinician', label: 'Clinician Portal', description: 'Educator and SLP dashboard', icon: <GraduationCap size={16} />, href: '/clinician', category: 'Navigate' },
  { id: 'find-help', label: 'Find Help', description: 'Locate speech-language pathologists', icon: <MapPin size={16} />, href: '/find-help', category: 'Navigate' },
  { id: 'settings', label: 'Settings', description: 'Language, theme, text size', icon: <Settings size={16} />, href: '/settings', category: 'Navigate' },
  { id: 'about', label: 'About', description: 'Mission, research, developer bio', icon: <Info size={16} />, href: '/about', category: 'Navigate' },
  // Games
  { id: 'story-studio', label: 'Story Studio', description: 'Conversational therapy with recasting', icon: <Mic size={16} />, href: '/play/story-studio', category: 'Games' },
  { id: 'sound-safari', label: 'Sound Safari', description: 'Articulation practice', icon: <Mic size={16} />, href: '/play/sound-safari', category: 'Games' },
  { id: 'word-garden', label: 'Word Garden', description: 'Vocabulary building', icon: <BookOpen size={16} />, href: '/play/word-garden', category: 'Games' },
  { id: 'rhythm-river', label: 'Rhythm River', description: 'Sentence fluency and prosody', icon: <Mic size={16} />, href: '/play/rhythm-river', category: 'Games' },
  { id: 'tongue-gym', label: 'Tongue Gym', description: 'Oral-motor strengthening', icon: <Mic size={16} />, href: '/play/tongue-gym', category: 'Games' },
  { id: 'emotion-echo', label: 'Emotion Echo', description: 'Prosody-based emotion recognition', icon: <Mic size={16} />, href: '/play/emotion-echo', category: 'Games' },
  { id: 'reader', label: 'Reader', description: 'Read aloud from text or PDF', icon: <Mic size={16} />, href: '/play/reader', category: 'Games' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setQuery('');
      router.push(item.href);
    },
    [router]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatFiltered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatFiltered.length) % flatFiltered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) {
          handleSelect(flatFiltered[selectedIndex]);
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, selectedIndex, flatFiltered, handleSelect]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-navy/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-1/2 top-[20%] z-[101] w-[90vw] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl bg-white dark:bg-[#1E1E36] shadow-2xl border border-teal/10"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-teal/10 px-4 py-3">
              <Search size={18} className="text-teal shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, games, features..."
                className="flex-1 bg-transparent text-sm font-body text-navy dark:text-white placeholder:text-slate/50 outline-none"
              />
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg bg-teal/8 px-2 py-1 text-[10px] font-medium text-teal"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {flatFiltered.length === 0 ? (
                <p className="py-8 text-center text-sm font-body text-muted">
                  No results found.
                </p>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate/50">
                      {category}
                    </p>
                    {items.map((item) => {
                      const globalIndex = flatFiltered.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`
                            flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left
                            transition-colors duration-150
                            ${isSelected
                              ? 'bg-teal/8 dark:bg-teal/12'
                              : 'hover:bg-teal/5 dark:hover:bg-white/5'
                            }
                          `}
                        >
                          <span className={`shrink-0 ${isSelected ? 'text-teal' : 'text-slate/60'}`}>
                            {item.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-teal' : 'text-navy dark:text-white'}`}>
                              {item.label}
                            </p>
                            <p className="text-xs text-slate/50 truncate">
                              {item.description}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="shrink-0 text-[10px] text-teal/60">
                              Enter
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-teal/10 px-4 py-2.5 text-[10px] text-slate/40">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-teal/8 px-1.5 py-0.5 font-mono text-teal/60">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-teal/8 px-1.5 py-0.5 font-mono text-teal/60">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-teal/8 px-1.5 py-0.5 font-mono text-teal/60">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
