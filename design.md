# BoloBridge Design Direction — "The Calm Analog"

> **Creative Direction:** Calm, analog, clean, grainy, editorial.
> Think: Kinfolk magazine meets a children's science textbook.
> Feel: warm paper, serif italics, muted earth tones, film grain, hand-drawn details.

---

## 1. Aesthetic Pillars & Anti-Slop Rules

**Pillars:**
- **Calm:** Generous whitespace (`py-24` minimum), slow transitions (`duration-500` min), breathing room.
- **Analog:** Film grain overlays (CSS `feTurbulence` noise, 3-5%), paper textures. Feels printed.
- **Clean:** Minimal UI chrome. Cards use tonal separation, not hard borders. "No-line" rule.
- **Grainy:** CSS `filter: url(#grain)` on backgrounds.
- **Italic:** Serif italic headlines. Body stays clean sans-serif.

**Strict Anti-Slop Rules (MUST Follow):**
1. **NO shimmer/shine effects.**
2. **NO gradient borders or gradient button fills** — use flat solid buttons only.
3. **NO electric/neon colors** — stay within the warm muted palette.
4. **NO particle effects** (e.g., Sparkles, confetti).
5. No hover glow/pulse — gentle lift (2px) + subtle shadow expansion only.
6. **No "AI" language** — avoid "AI-powered", "smart", "intelligent" in copy.
7. **Inclusive illustrations** — abstract, no specific facial features (use watercolor-style PNGs).

---

## 2. Color Palette & Typography

**Typography:**
- **Headlines (h1, h2):** `Lora` (serif, italic weight) — warm, editorial, literary.
- **Body:** `Inter` (sans-serif) — clean, readable, modern.
- **Accents:** `Lora` (serif italic) for pull-quotes and callout text.

**Colors:**
- `cream`: `#FAF8F5` (Page backgrounds)
- `sage-teal`: `#5C4D9A` (Deep Violet now acts as primary accent, CTAs)
- `warm-camel`: `#C2956B` (Secondary accent, highlights)
- `muted-lavender`: `#8B7EC8` (Tertiary, badges, tags)
- `deep-navy`: `#2D3142` (Dark text, dark mode base `#1A1A2E`)
- `soft-coral`: `#D16D6D` (Warm accents, alerts)
- `sage-green`: `#6B8F71` (Success states, nature imagery)
- `warm-white`: `#F5F1EB` (Card backgrounds)

---

## 3. Component Architecture

**Keep & Enhance:**
- `BlurFade`: scroll-triggered fade-in.
- `TiltCard`: framer-motion `rotateX`/`rotateY` spring physics — **apply to ALL bento/feature cards**.
- `MagneticButton`: cursor-following spring physics — **apply to ALL buttons site-wide**.
- `GrainOverlay`: applied to every page via fixed overlay in `layout.tsx`.
- `AnimatedNumber` & `CountAnimation`: for dashboard stats and counters.
- `Timeline`: vertical scroll-driven entry list for HowItWorks.
- `FloatingHeader`: sticky, blur backdrop pill navbar.

---

## 4. `design-assets/` Folder Structure

The `design-assets/` folder is now strictly organized into three distinct subdirectories:

### `mockups/`
Contains 102 self-contained HTML files generated via Stitch MCP. These serve as the **structural and layout reference** for every page (e.g., `07-homepage-hero.html`, `12-dashboard.html`). Use these to see how "The Calm Analog" translates into Tailwind CSS and DOM structures.

### `screenshots/`
Reference images of the completed UI designs from previous development rounds.

### `stitchimgages/`
**Initial library of game and UI illustrations.** 
This folder contains 240 extracted `.png` files (abstract watercolor animals, items, faces) derived from early Stitch mockups.
- *Rule:* Do NOT use emojis for UI visuals anymore. Instead, import these existing PNGs, OR feel free to use the Stitch MCP to generate new illustrations in the same "Calm Analog" watercolor style when needed.
- *Tip:* The filenames are highly descriptive (e.g., `minimalist_watercolor_illustration_of_a_playful_monkey.png`), making them easy to match to context.

---

## 5. UI Overhaul & HTML Mapping Guide

Use the following HTML files from `design-assets/mockups/` when implementing pages:

| Page / Section | Source HTML File(s) | Notes |
|----------------|---------------------|-------|
| **Homepage** | `07-homepage-hero`, `08-homepage-pillars`, `15-how-it-works-stats`, `18-global-cta` | Add `TiltCard` to pillars, `Timeline` for HowItWorks. |
| **Site Nav/Footer** | `16-navigation-footer` | Floating pill navbar, 4-column editorial footer. |
| **Screening** | `11-screening`, `17-screening-results` | Purple gradient hero, glassmorphism cards. |
| **Dashboard** | `12-dashboard`, `81-practice-calendar` | Stat cards with left accent bars, XP bar. |
| **Play (Games Hub)**| `32-bento-play-v2` | Best bento grid layout with featured 2-col + 1-col. |
| **Learn Hub** | `31-editorial-learn-page`, `34` | Editorial chapter-list style with Roman numerals. |
| **About Page** | `09-about-page` | Editorial layout with developer bio and research. |
| **Find Help** | `10-find-help`, `78-help-center-faq` | Warm hero + search form + international resources. |
| **Profile** | `19-profile-creation` | Centered form card, avatar selector, tags. |
| **In-Game UIs** | `20`, `23`, `24`, `25`, `26`, `47`, `48` | Contains specific layouts for each Game. |
| **Dark Mode** | `21`, `29`, `36`, `40`, `44`, `79` | Deep navy base `#1A1A2E`, reduced grain opacity. |

---

> **Note:** The Sonnet Execution Roadmap (Phases 1–4: Stitch variant generation, emoji purge, page rebuilds) was removed from this file on 2026-03-24 as completed work. See CHANGELOG.md v4.0.0–v4.1.0 for the outcome.