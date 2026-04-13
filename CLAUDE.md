# BoloBridge — Claude Code Reference

> **Project:** BoloBridge — speech therapy web app for children ages 3–12.
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand
> **Aesthetic:** "Calm Analog" — Kinfolk magazine meets children's science textbook. Warm, editorial, grainy, serif-italic.

---

## ⚡ Before Every Task (Non-Negotiable Pre-Flight)

1. **Read the relevant file** before editing — never edit blind
2. **Check if the component already exists** in `components/ui/` or `components/layout/` before creating a new one
3. **Verify color tokens** from `globals.css` — never hardcode a hex value that has a CSS token
4. **After any UI change** — take a screenshot via the Preview MCP to verify visually
5. **Update `CHANGELOG.md`** before finishing the response (see format below)

---

## ⛔ Never Do — Anti-Slop Rules (CRITICAL)

These are absolute. No exceptions.

- **NO shimmer / shine effects** on any element
- **NO gradient borders or gradient button fills** — flat solid buttons only
- **NO electric or neon colors** — no `emerald-400`, `cyan-400`, `blue-500`; stay within the warm muted palette
- **NO particle effects** — no confetti, no sparkles rain
- **NO hover glow / pulse** — gentle lift (`y: -4` to `-8px`) + subtle shadow only
- **NO emojis as visual elements** in any `.tsx`, `.ts`, or app `.json` file — use watercolor PNGs from `design-assets/stitchimgages/` or generate via Stitch MCP
- **NO "AI-powered", "smart", "intelligent"** in user-facing copy
- **NO French, Mandarin, Arabic, or any unsupported language** — see Language Constraints below
- **NO "VoxBloom"** — project is named **BoloBridge** everywhere, always

### Files to Never Modify Without Explicit Instruction
- `design-assets/` — read-only reference folder
- `lib/i18n.ts` translation keys — only add/edit keys when explicitly asked
- `public/illustrations/` — only add, never delete
- Any `.env` file

---

## 🎨 Design System — Inlined Critical Rules

### Colors (from `globals.css` tokens)
| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg-cream` | `#FAF8F5` | `#1A1A2E` | Page backgrounds |
| `text-navy` | `#2D3142` | `#E8E4DE` | Primary text |
| `text-teal` / `bg-teal` | `#5C4D9A` | same | Primary accent, CTAs |
| `text-coral` / `bg-coral` | `#C2956B` | same | Secondary accent |
| `text-violet` / `bg-violet` | `#8B7EC8` | same | Tertiary, badges |
| `text-success` / `bg-success` | `#6B8F71` | same | Success states |
| `bg-cloud` | dark bg variant | `#1A1A2E` | Dark mode page bg |

### Typography
- **Headlines (h1, h2):** `font-heading` = Lora serif — always use `italic` class with headings
- **Body:** `font-body` = Inter sans-serif
- **Minimum section padding:** `py-24` — never less
- **Card border-radius:** `rounded-2xl` (20–24px); **Buttons:** `rounded-xl` (12px)

### Required Components (Apply Everywhere)
- **`TiltCard`** — wrap ALL bento/feature cards. `tiltAmount={4–6}`
- **`MagneticButton`** — wrap ALL primary buttons site-wide
- **`BlurFade`** — scroll-triggered entrance on all sections
- **`GrainOverlay`** — already applied globally via `layout.tsx` — do not add it again per-page

### Dark Mode
- Use `dark:` Tailwind variants for all colors
- `bg-cream` → `dark:bg-cloud` (`#1A1A2E`)
- `text-navy` → `dark:text-white`
- Inline styles can't use `dark:` — use two separate divs with `dark:hidden` / `hidden dark:block`
- Theme managed by `next-themes` (`useTheme()` hook)

---

## ⚠️ Naming & Language Constraints (CRITICAL)

- **Project Name:** BoloBridge (renamed from VoxBloom on 2026-03-21). Never use the old name.
- **Supported Languages ONLY:** English · Spanish · Hindi · Afrikaans · Bengali · Tagalog
- **Never** add or reference French, Mandarin, Arabic, or any other language anywhere

---

## 🏗️ Architecture Decisions (Why Things Are Built This Way)

| Decision | Rationale |
|----------|-----------|
| **Zustand** over React Context | Avoids re-render cascades; `useAppStore` holds `completedModules`, `assessmentResults`, `currentUser` |
| **`ogl`** for WebGL (not Three.js) | Smaller bundle; used only for `VoicePoweredOrb` component |
| **`next-themes`** for dark mode | Handles SSR hydration correctly; avoids flash-of-unstyled-content |
| **CSS variable tokens** in `globals.css` | `bg-cream`, `text-teal` etc. remap automatically in dark mode via `:root.dark` |
| **`date-fns`** for calendar | Already a transitive dependency; no extra bundle cost |
| **No emoji** | Design system calls for watercolor PNG illustrations — emoji break the "Calm Analog" editorial tone |

---

## 📦 Key Components Inventory

Before creating anything new, check these exist:

| Component | Path | Notes |
|-----------|------|-------|
| `TiltCard` | `components/ui/TiltCard.tsx` | Framer Motion rotateX/Y spring |
| `MagneticButton` | `components/ui/MagneticButton.tsx` | Cursor-following spring |
| `BlurFade` | `components/ui/BlurFade.tsx` | Scroll-triggered fade-in |
| `VoicePoweredOrb` | `components/ui/voice-powered-orb.tsx` | WebGL orb via `ogl` |
| `BackgroundPaths` | `components/ui/BackgroundPaths.tsx` | Animated SVG floating paths |
| `GrainOverlay` | `components/ui/GrainOverlay.tsx` | CSS feTurbulence film grain |
| `FloatingHeader` | `components/layout/Navbar.tsx` | Sticky pill navbar |
| `GitHubCalendar` | `components/ui/git-hub-calendar.tsx` | Contribution heatmap |
| `AnimatedNumber` | `components/ui/AnimatedNumber.tsx` | Counter animation |
| `Section` | `components/ui/Section.tsx` | Standard page section wrapper |

---

## 🔧 Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

---

## 📁 Project Structure

```
voxbloom/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Reusable UI primitives (TiltCard, BlurFade, etc.)
│   └── layout/             # Navbar, Footer, Section wrappers
├── data/                   # JSON content (exercises, modules, milestones)
├── hooks/                  # Custom React hooks (speech, biomarkers)
├── lib/                    # i18n, Zustand store, constants, algorithms
├── types/                  # TypeScript interfaces
├── public/illustrations/   # SVG + PNG illustration assets (do not delete)
├── design-assets/
│   ├── stitchdesigns/      # 27 Stitch HTML reference files (READ ONLY)
│   ├── screenshots/        # UI review screenshots (READ ONLY)
│   └── stitchimgages/      # 240+ watercolor PNG illustrations (READ ONLY)
├── design.md               # Full design history, color specs, HTML mapping, Stitch roadmap
├── CLAUDE.md               # This file — AI rules and quick-reference
├── CHANGELOG.md            # Every change ever made (mandatory logging)
└── README.md               # Setup and architecture overview
```

---

## 🛠️ MCP Tools Available

| Tool | When to Use |
|------|-------------|
| **`mcp__magic__21st_magic_component_builder`** | Source polished UI components (toggles, inputs, cards) from 21st.dev |
| **`mcp__stitch__*`** | Generate new watercolor illustrations or page layout variants |
| **`mcp__7dfa1b69__deploy_to_vercel`** | Deploy to Vercel (user must request explicitly) |
| **`mcp__Claude_Preview__*`** | Take screenshots, click, scroll, inspect the running dev server |
| **`mcp__Shadcn_UI__*`** | Get shadcn component code when building form elements |

---

## 📋 CHANGELOG.md — Mandatory Logging Rule (CRITICAL)

**After EVERY prompt that results in any file change — no matter how small — update `CHANGELOG.md` before finishing your response.**

This is non-negotiable. Log: CSS tweaks, text changes, removed imports, config updates, dependency installs, bug fixes.

### Required Entry Format

```
### <Short title of what changed>
**Timestamp:** <date from currentDate context>
**Prompt:** "<exact or paraphrased user request>"

**Problem / Goal:** <what was wrong or what was requested>
**Root cause (if bug):** <why it was happening>
**Fix / Change:** <what was done and why>

**Files changed:**
- `path/to/file.tsx` — <description of change>
```

### Rules
- Prepend new entries (most recent first) under the current version heading
- Separate entry per logical change — never batch unrelated changes
- Document: symptom → root cause → fix (so future sessions can learn)
- Create a new version heading (e.g. `## [v4.2.0]`) when a significant feature set is complete
