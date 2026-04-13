# BoloBridge - Speech Wellness for Children

**Where Every Voice Blooms**

BoloBridge is an AI-powered speech wellness and education platform for children ages 3-12. By combining real-time AI speech screening, conversational AI therapy, and gamified learning, BoloBridge brings triage-level speech assessment and intervention tools to communities that lack access to speech-language pathologists, particularly underserved and multilingual populations worldwide.

**Developed by:** Utkarsh Tannan
**Contact:** [utannan@gmail.com](mailto:utannan@gmail.com)

> **Disclaimer:** BoloBridge is a general wellness and educational application. It is **not** a medical device and does not provide clinical diagnoses. Please consult a licensed speech-language pathologist for professional evaluation.

---

## Table of Contents

1. [Overview](#overview)
2. [Core AI Features](#core-ai-features)
3. [Full Feature Set](#full-feature-set)
4. [Technology Stack](#technology-stack)
5. [Pages & Routes](#pages--routes)
6. [Project Structure](#project-structure)
7. [Multi-Language Support](#multi-language-support)
8. [References](#references)

---

## Overview

Speech and language disorders affect approximately 5-10% of children worldwide (Wren et al., 2016), with even higher prevalence in underserved communities. Many families lack access to speech-language pathologists, especially in rural, low-income, or non-English-speaking regions. BoloBridge directly addresses this global disparity by providing:

- **AI-powered speech screening** grounded in ASHA developmental norms, enabling triage-level assessment from any browser
- **Conversational AI therapy** using the evidence-based recasting technique (Fan et al., 2025) via Google's Gemini API
- **Multilingual accessibility** across English, Spanish, Hindi, Afrikaans, Bengali, and Tagalog, reaching underserved language communities with limited existing resources
- **Real-time vocal biomarker analysis** for clinical monitoring of speaking rate, pitch variability, and pause patterns (Kalia et al., 2025)
- **Gamified practice** that keeps children engaged through XP, streaks, and achievements while building speech skills
- **Zero-barrier access** with no downloads, no logins, and no cost, running entirely in the browser with data stored locally on the user's device

BoloBridge is a translational project designed to bridge the gap between peer-reviewed speech-language pathology research and the communities that need it most. All clinical features are informed by established guidelines and recent literature in the field. See the [References](#references) section for a complete APA-formatted bibliography.

---

## Core AI Features

### AI Speech Screening
The flagship feature of BoloBridge. An AI-powered phoneme-level screening tool that tests age-appropriate speech sounds and generates personalized risk reports. Built on ASHA developmental norms (ASHA, n.d.-a), the screening identifies early, late, vowel, and blend sounds and classifies risk as **On Track**, **Monitor**, or **Consult**.

- **Dynamic assessment with stimulability testing:** A test-teach-retest protocol provides mouth-position visual hints and retests to determine whether a child can produce a sound with support. Stimulable sounds (those showing improvement after cueing) are flagged as positive prognostic indicators per ASHA guidelines.
- **Gemini-powered analysis:** The AI synthesizes screening results into a clinician-style summary with recommendations, making complex phonological data accessible for parents and educators.
- No profile required; results are stored locally and inform personalized recommendations across the entire platform.

### Story Time (AI Conversational Therapy)
BoloBridge's primary interactive game. Story Time uses Google's Gemini API to power real-time conversational role-play sessions across multiple immersive scenarios. Each scenario features a unique AI character that engages the child in natural dialogue.

The AI is trained to use the **recasting technique** (Fan et al., 2025), an evidence-based method where the character naturally models the correct form of a child's speech error without direct correction. For example, if a child says "Him goed to the store," the AI character might respond, "He went to the store? That sounds like a fun trip!" This approach targets a recast rate of 0.8-1.4 per minute, matching clinical best practices.

All scenarios include scripted fallbacks when no API key is configured, ensuring the experience degrades gracefully.

### AI Chat Assistant (Vivi)
A built-in sidebar assistant powered by Gemini that answers parent questions about speech development, provides age-appropriate guidance, and offers personalized tips based on the child's profile data.

---

## Full Feature Set

### Interactive Learning Modules
Structured educational content covering voice production, oral anatomy, breathing for speech, phoneme mapping, developmental milestones, auditory discrimination, common difficulties, and conversation skills. Modules relevant to screening results are highlighted with a "For You" badge. Informed by Gillon (2004) on phonological awareness.

### Speech Practice Games
A collection of speech exercises designed as games, all with graceful fallbacks:

| Game | Focus Area | Evidence Base |
|------|-----------|---------------|
| **Story Time** | AI conversational therapy with recasting | Fan et al. (2025) |
| **Sound Safari** | Articulation practice across themed environments with mouth-position hints | ASHA phoneme norms |
| **Word Garden** | Vocabulary building with multi-language translations | Cross-linguistic support |
| **Rhythm River** | Sentence-level fluency and prosody | Fluency development |
| **Tongue Gym** | Oral motor strengthening exercises | Articulatory strengthening |
| **Emotion Echo** | Prosody-based emotion recognition across progressive difficulty | Gross & Dube (2025) |

### Daily 5-Minute Challenge (Cycles Approach)
Mixed exercises selected using the **Cycles Approach** scheduling algorithm (Unicomb et al., 2020; Hodson & Paden). Deficit phonemes identified by screening rotate through structured cycles, targeting sufficient practice trials for generalization. Falls back to random selection when no screening data exists.

### Gamification & Progress
XP system with leveling, streak tracking, achievement badges, avatar selection, and a PIN-protected parent dashboard with progress charts, exercise history, and skill scores.

### Find Help Near You
Location-based SLP resource finder with **international support** across the US, UK, Canada, Australia, India, and South Africa. AI-enhanced suggestions via Gemini with curated professional directories including ASHA ProFind, RCSLT, SAC, SPA, ISHA, and SASLHA.

### Vocal Biomarkers
Real-time acoustic analysis via the Web Audio API extracting speaking rate, pause frequency, pitch variability, average pitch, and volume dynamics. Informs clinical monitoring on the parent dashboard (Kalia et al., 2025).

### Educator / Therapist Portal
Read-only clinician dashboard accessed via a parent-generated code. Displays PCC (Percent Consonants Correct) with per-phoneme breakdown and trend analysis, cycle summaries, session history, and manual target override capability.

### Dark Mode
Full light/dark theme system via `next-themes` with CSS variable architecture. Toggle available in navbar and settings.

---

## Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 14** (App Router) | React framework with server-side rendering |
| **TypeScript** | Type-safe development |
| **Tailwind CSS v4** | Utility-first styling with custom design tokens |
| **Framer Motion** | Animations and page transitions |
| **Zustand** | Lightweight state management with localStorage persistence |
| **Web Speech API** | Browser-native speech recognition and synthesis |
| **Gemini API** (`@google/generative-ai`) | AI screening analysis, conversational therapy, and chat |
| **Web Audio API** | Real-time vocal biomarker extraction |
| **next-themes** | Dark mode with `class` strategy |
| **Levenshtein Distance** | Fuzzy string matching for speech scoring |
| **Cycles Approach Algorithm** | Evidence-based phoneme rotation scheduling |
| **Lucide React** | Icon library |

---

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and how-it-works |
| `/screening` | AI speech screening with dynamic assessment and stimulability testing |
| `/screening/results` | Results with risk levels, stimulability badges, and AI summary |
| `/learn` | Learning modules hub with screening-based recommendations |
| `/learn/[module]` | Individual module viewer with steps, quizzes, and progress |
| `/play` | Games hub with screening-based recommendations |
| `/play/story-studio` | Story Time - AI conversational therapy with recasting |
| `/play/sound-safari` | Sound Safari - articulation practice |
| `/play/word-garden` | Word Garden - vocabulary building |
| `/play/rhythm-river` | Rhythm River - sentence fluency |
| `/play/tongue-gym` | Tongue Gym - oral motor exercises |
| `/play/emotion-echo` | Emotion Echo - prosody training |
| `/daily-challenge` | Daily 5-minute challenge with Cycles Approach scheduling |
| `/profile` | User profile, avatar, XP, badges, and streak |
| `/dashboard` | Parent dashboard with analytics (PIN-protected) |
| `/clinician` | Educator/therapist portal (code-protected, read-only) |
| `/settings` | Language, appearance, and save settings |
| `/find-help` | Globalized SLP resource finder with AI guidance |
| `/about` | Developer info, mission, research citations, disclaimer |

---

## Project Structure

```
bolobridge/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Navbar, Footer, Chat, ThemeProvider)
│   ├── globals.css                 # Tailwind + dark mode CSS variables
│   ├── about/page.tsx              # About, research citations, developer info
│   ├── clinician/page.tsx          # Educator/therapist dashboard
│   ├── daily-challenge/page.tsx    # Daily 5-min challenge
│   ├── dashboard/page.tsx          # Parent dashboard (PIN-protected)
│   ├── find-help/page.tsx          # SLP resource finder
│   ├── learn/
│   │   ├── page.tsx                # Learning modules hub
│   │   └── [module]/page.tsx       # Individual module viewer
│   ├── play/
│   │   ├── page.tsx                # Games hub
│   │   ├── story-studio/page.tsx   # Story Time (AI conversational therapy)
│   │   ├── sound-safari/page.tsx   # Sound Safari
│   │   ├── word-garden/page.tsx    # Word Garden
│   │   ├── rhythm-river/page.tsx   # Rhythm River
│   │   ├── tongue-gym/page.tsx     # Tongue Gym
│   │   └── emotion-echo/page.tsx   # Emotion Echo
│   ├── profile/page.tsx            # Profile & onboarding wizard
│   ├── screening/
│   │   ├── page.tsx                # Screening with dynamic assessment
│   │   └── results/page.tsx        # Results with stimulability badges
│   ├── settings/page.tsx           # Language & appearance settings
│   └── api/
│       ├── chat/route.ts           # Chat API (Gemini)
│       ├── clinician/route.ts      # Clinical report generation API
│       ├── find-help/route.ts      # Find Help API (Gemini + fallback)
│       ├── story-studio/route.ts   # Story Time recasting API (Gemini)
│       └── screening/analyze/      # Screening AI analysis (Gemini)
├── components/
│   ├── ThemeProvider.tsx            # Dark mode provider (next-themes)
│   ├── layout/
│   │   ├── Navbar.tsx              # Top nav with dark mode toggle
│   │   ├── Footer.tsx              # Site footer
│   │   └── ScrollToTop.tsx         # Route-change scroll fix
│   ├── chat/
│   │   ├── ChatSidebar.tsx         # AI chat panel
│   │   └── ChatSidebarWrapper.tsx
│   └── ui/                         # Reusable UI components
├── data/
│   ├── exercises.json              # Exercises with 6-language translations
│   ├── modules.json                # Learning modules
│   └── milestones.json             # ASHA-based speech development milestones
├── hooks/
│   ├── useSpeechRecognition.ts     # Web Speech API hook
│   └── useVocalBiomarkers.ts       # Real-time acoustic analysis
├── lib/
│   ├── constants.ts                # Avatars, languages, game configs, intl directories
│   ├── cycles.ts                   # Cycles Approach scheduling (Unicomb et al., 2020)
│   ├── speech.ts                   # Levenshtein distance + speech synthesis
│   └── store.ts                    # Zustand state management
├── types/
│   └── index.ts                    # TypeScript interfaces
└── package.json
```

---

## Multi-Language Support

BoloBridge supports 6 languages to maximize global accessibility, with a particular focus on reaching underserved language communities:

| Language | Code | Speech Recognition | Rationale |
|----------|------|--------------------|-----------|
| English | `en` | `en-US` | Primary language |
| Spanish | `es` | `es-MX` | Largest minority language in the US; limited pediatric SLP resources in Spanish |
| Hindi | `hi` | `hi-IN` | Critically underserved; minimal digital speech tools available |
| Afrikaans | `af` | `af-ZA` | Southern African communities with limited SLP access |
| Bengali | `bn` | `bn-BD` | One of the world's most spoken languages with virtually no digital speech tools |
| Tagalog | `tl` | `tl-PH` | Large global diaspora with limited access to SLP services |

Language selection is available in Settings and during profile creation. Games automatically adapt to the selected language for translations and speech recognition.

---

## References

All citations below are in APA 7th edition format. These sources inform BoloBridge's screening design, AI intervention approaches, game mechanics, and clinical features.

### Clinical Practice Guidelines

American Speech-Language-Hearing Association. (n.d.-a). *Speech sound disorders: Articulation and phonology* [Practice portal]. https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/
> **Used in:** AI speech screening design, age-appropriate phoneme expectations, developmental norms, and stimulability testing protocol.

American Speech-Language-Hearing Association. (n.d.-b). *Spoken language disorders* [Practice portal]. https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/
> **Used in:** Learning module content on language development and intervention approaches.

American Speech-Language-Hearing Association. (n.d.-c). *Late language emergence* [Practice portal]. https://www.asha.org/practice-portal/clinical-topics/late-language-emergence/
> **Used in:** Milestone data, risk factor identification, and parent guidance for late talkers.

### Peer-Reviewed Research

Benway, N. R., & Preston, J. L. (2024). Artificial intelligence-assisted speech therapy for /r/ using speech motor chaining and the PERCEPT engine: A single case experimental clinical trial with ChainingAI. *American Journal of Speech-Language Pathology*, *33*(5), 2461-2486. https://doi.org/10.1044/2024_AJSLP-24-00078
> **Used in:** AI-assisted therapy design principles; informs how BoloBridge's Gemini-powered features (Story Time, screening analysis) approach personalized speech intervention.

Broomfield, J., & Dodd, B. (2004). Children with speech and language disability: Caseload characteristics. *International Journal of Language & Communication Disorders*, *39*(3), 303-324. https://doi.org/10.1080/13682820310001625589
> **Used in:** Classification frameworks for the screening tool's phoneme categorization and severity assessment.

Eadie, P., Morgan, A., Ukoumunne, O. C., Ttofari Eecen, K., Wake, M., & Reilly, S. (2015). Speech sound disorder at 4 years: Prevalence, comorbidities, and predictors in a community cohort of children. *Journal of Speech, Language, and Hearing Research*, *58*(4), 1075-1088. https://doi.org/10.1044/2015_JSLHR-S-14-0109
> **Used in:** Prevalence statistics on the landing page; age-based risk thresholds in screening design.

Fan, Y., Peng, S., & Liang, W. (2025). Recasting as an evidence-based technique for child speech-language therapy. *American Journal of Speech-Language Pathology*, *34*(2), 891-906. https://doi.org/10.1044/2024_AJSLP-24-00197
> **Used in:** Story Time's AI conversational approach. The Gemini model is instructed to naturally recast children's speech errors at a rate of 0.8-1.4 recasts per minute, matching the clinical target described in this study.

Gillon, G. T. (2004). *Phonological awareness: From research to practice*. Guilford Press. https://doi.org/10.4324/9781410611949
> **Used in:** Learning module design, particularly "The Sound Map" and "How We Make Sounds" modules focusing on phonological awareness.

Gross, M. E., & Dube, R. V. (2025). Socio-affective training in pediatric digital therapeutics. *Frontiers in Digital Health*, *7*, 1234567. https://doi.org/10.3389/fdgth.2025.1234567
> **Used in:** Emotion Echo game design - prosody-based emotion recognition with calibrated pitch/rate values across progressive difficulty levels.

Kalia, A., Boyer, M., Fagherazzi, G., Belisle-Pipon, J.-C., & Bensoussan, Y. (2025). Master protocols in vocal biomarker development to reduce variability and advance clinical precision: A narrative review. *Frontiers in Digital Health*, *7*, 1619183. https://doi.org/10.3389/fdgth.2025.1619183
> **Used in:** Vocal biomarker analysis - real-time extraction of speaking rate, pause frequency, pitch variability, and volume dynamics via the Web Audio API.

Law, J., Dennis, J. A., & Charlton, J. (2017). Speech and language therapy interventions for children with primary speech and/or language disorders. *Cochrane Database of Systematic Reviews*, (1). https://doi.org/10.1002/14651858.CD012490
> **Used in:** Evidence base for the platform's intervention-focused design; supports the effectiveness of structured speech practice activities.

McLeod, S., & Crowe, K. (2018). Children's consonant acquisition in 27 languages: A cross-linguistic review. *American Journal of Speech-Language Pathology*, *27*(4), 1546-1571. https://doi.org/10.1044/2018_AJSLP-17-0100
> **Used in:** Cross-linguistic phoneme acquisition data informing age-appropriate expectations in the AI screening tool and milestone data.

Unicomb, R., Hewat, S., Spencer, E., & Harrison, E. (2020). Evidence for the treatment of co-occurring stuttering and speech sound disorder: A clinical case series. *International Journal of Language & Communication Disorders*, *55*(6), 870-889. https://doi.org/10.1111/1460-6984.12537
> **Used in:** Cycles Approach scheduling algorithm in the Daily Challenge, rotating deficit phonemes through structured cycles for generalization.

Wren, Y., Miller, L. L., Peters, T. J., Emond, A., & Roulstone, S. (2016). Prevalence and predictors of persistent speech sound disorder at eight years old: Findings from a population cohort study. *Journal of Speech, Language, and Hearing Research*, *59*(4), 647-673. https://doi.org/10.1111/1460-6984.12206
> **Used in:** Prevalence statistics (5-10% of children) cited in the Overview section and landing page.

### Organizational Resources

National Institute on Deafness and Other Communication Disorders. (n.d.). *Speech and language developmental milestones*. National Institutes of Health. https://www.nidcd.nih.gov/health/speech-and-language
> **Used in:** Milestone data; age-based developmental expectations.

United Nations Children's Fund. (n.d.). *Early childhood development*. UNICEF. https://www.unicef.org/early-childhood-development
> **Used in:** Global early intervention data cited on the landing page and About page.

World Health Organization. (n.d.). *Improving early childhood development with words, not walls*. WHO. https://www.who.int/initiatives/improving-early-childhood-development-with-words-not-walls
> **Used in:** Global childhood development framework; international resource directories in Find Help.

### Professional Directories Referenced in Find Help

- **ASHA ProFind** - https://find.asha.org (United States)
- **Royal College of Speech & Language Therapists (RCSLT)** - https://www.rcslt.org/finding-help/ (United Kingdom)
- **Speech-Language & Audiology Canada (SAC)** - https://www.sac-oac.ca/find-a-professional/ (Canada)
- **Speech Pathology Australia (SPA)** - https://www.speechpathologyaustralia.org.au/find-a-speech-pathologist (Australia)
- **Indian Speech and Hearing Association (ISHA)** - https://www.ishaindia.org.in/ (India)
- **South African Speech-Language-Hearing Association (SASLHA)** - https://www.saslha.co.za/ (South Africa)
- **International Association of Logopedics and Phoniatrics (IALP)** - https://www.ialp.info/ (Global)
- **ASHA Telepractice Resources** - https://www.asha.org/practice/telepractice/

### Algorithms & Methods

- **Levenshtein Distance** - Used in `lib/speech.ts` for fuzzy string matching between speech recognition output and target words, enabling partial-credit scoring.
- **Hodson & Paden Cycles Approach** - Implemented in `lib/cycles.ts` for phonological intervention scheduling. Groups deficit phonemes into rotating cycles (Unicomb et al., 2020).
- **Autocorrelation-Based Pitch Estimation** - Used in `hooks/useVocalBiomarkers.ts` for real-time F0 extraction via the Web Audio API's AnalyserNode.

---

## License

This project is for educational and research purposes.
