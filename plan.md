# Vocabulary Practice SPA — Implementation Plan

## 1. Project Summary

A single-page application for practicing English vocabulary deployed to `webtarget.dev` on Cloudflare Pages.

**End-to-end flow:**

1. **Setup screen** — user selects a word ID range (1–1900) and a practice mode (JP→EN or EN→EN), then starts a session.
2. **Practice screen** — words from the selected range are shuffled into a queue. The user is shown a prompt and types the English word. Correct answers remove the word from the queue permanently; incorrect answers reinsert the word at a random later position. The session ends only when every word has been answered correctly at least once.
3. **Results screen** — shows total elapsed time, accuracy rate (correct attempts / total attempts), and a ranked table of words the user missed most often, sorted descending by incorrect attempt count.

No backend. No authentication. No localStorage. All state is ephemeral React state that resets on page reload.

---

## 2. Data Layer

### File location

```
src/data/words.json
```

Words are imported statically through Vite's JSON module support. No runtime fetch needed.

### TypeScript types

```typescript
// src/types.ts

export type PracticeMode = 'jp-en' | 'en-en';

export interface Word {
  id: number;
  word: string;
  part_of_speech: string;       // e.g. "動詞"
  pronunciation: string;         // e.g. "[kriˈeɪt]"
  japanese_meaning: string;      // e.g. "創り出す；引き起こす"
  example_sentence: string;      // e.g. "I want to create a beautiful painting."
}

export interface SessionConfig {
  start: number;   // 1–1900
  end: number;     // start–1900
  mode: PracticeMode;
}

export interface CompletedResult {
  word: Word;
  incorrectCount: number;  // 0 means first-try success
}

export interface SessionResult {
  config: SessionConfig;
  completedWords: CompletedResult[];  // ordered by completion time
  startTime: number;     // Date.now() at session start
  endTime: number;       // Date.now() at session end
}
```

### Utility functions

```typescript
// src/utils/words.ts
import wordsData from '../data/words.json';

const ALL_WORDS: Word[] = wordsData as Word[];

export function getWordsInRange(start: number, end: number): Word[] {
  return ALL_WORDS.filter(w => w.id >= start && w.id <= end);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

The `tsconfig.json` must include `"resolveJsonModule": true` (default in Vite templates).

---

## 3. Session Logic

### State shape

```typescript
// src/hooks/useSession.ts

interface SessionState {
  config: SessionConfig;
  allWords: Word[];               // full range, for result reference
  queue: Word[];                  // current working queue; queue[0] is the active word
  incorrectCounts: Map<number, number>;  // wordId → total wrong attempts this session
  completedIds: Set<number>;      // wordIds answered correctly at least once
  startTime: number;
}
```

### Session lifecycle

**Initialization** (called when user presses Start):
1. `allWords = getWordsInRange(config.start, config.end)`
2. `queue = shuffleArray(allWords)`
3. `incorrectCounts = new Map()` — all values start at 0 implicitly
4. `completedIds = new Set()`
5. `startTime = Date.now()`

**Submitting an answer** (`submitAnswer(userInput: string)`):
1. Normalize: `normalizedInput = userInput.trim().toLowerCase()`
2. Normalize target: `normalizedTarget = currentWord.word.trim().toLowerCase()`
3. **Correct** (`normalizedInput === normalizedTarget`):
   - Add `currentWord.id` to `completedIds`
   - Remove `queue[0]` (shift)
   - If `completedIds.size === allWords.length` → session complete → compute `SessionResult` and transition to results view
4. **Incorrect**:
   - Increment `incorrectCounts.get(currentWord.id) ?? 0` by 1
   - Remove `queue[0]` (shift), insert word at a random position in the remaining queue: `Math.floor(Math.random() * queue.length) + 1` (never position 0, so the next word is always different)
   - Edge case: if remaining queue has 0 elements (only one word left and it was wrong), re-insert at index 0 (back to front)

**Completion detection**: After every correct answer, check `completedIds.size === allWords.length`.

**Building SessionResult** (on completion):
```typescript
const result: SessionResult = {
  config,
  completedWords: allWords.map(w => ({
    word: w,
    incorrectCount: incorrectCounts.get(w.id) ?? 0,
  })),
  startTime,
  endTime: Date.now(),
};
```

### Hook API

```typescript
function useSession(config: SessionConfig): {
  currentWord: Word | null;
  queueLength: number;
  completedCount: number;
  totalCount: number;
  submitAnswer: (input: string) => 'correct' | 'incorrect' | 'complete';
  result: SessionResult | null;  // non-null only when complete
}
```

The `submitAnswer` return value drives transient UI feedback (flash green/red on the card) without polluting session state.

---

## 4. Component Architecture

All components live under `src/components/`. Screen-level components live under `src/screens/`.

### Screens

| Component | File | Description |
|---|---|---|
| `SetupScreen` | `screens/SetupScreen.tsx` | Range inputs, mode selector, start button |
| `PracticeScreen` | `screens/PracticeScreen.tsx` | Orchestrates practice session; owns `useSession` |
| `ResultsScreen` | `screens/ResultsScreen.tsx` | Displays elapsed time, accuracy, missed-words table |

### Components

| Component | File | Description |
|---|---|---|
| `RangeInput` | `components/RangeInput.tsx` | Labeled number input pair (Start ID / End ID) with live validation |
| `ModeSelector` | `components/ModeSelector.tsx` | Two-option toggle (JP→EN / EN→EN) with icon labels |
| `WordPrompt` | `components/WordPrompt.tsx` | Renders the prompt for the current word. Receives `word` and `mode`; delegates to `JpEnPrompt` or `EnEnPrompt` |
| `JpEnPrompt` | `components/JpEnPrompt.tsx` | Shows Japanese meaning + part of speech + pronunciation |
| `EnEnPrompt` | `components/EnEnPrompt.tsx` | Renders the example sentence with the target word replaced by a styled blank |
| `AnswerInput` | `components/AnswerInput.tsx` | Controlled text input + Submit button; auto-focuses on each word, supports Enter key |
| `FeedbackBanner` | `components/FeedbackBanner.tsx` | Transient correct/incorrect message shown briefly after each submission |
| `ProgressBar` | `components/ProgressBar.tsx` | Thin progress bar showing `completedCount / totalCount` |
| `SessionStats` | `components/SessionStats.tsx` | Live elapsed timer + `X / Y words` counter shown during practice |
| `StatCard` | `components/StatCard.tsx` | Reusable card for displaying a single stat (time, accuracy) on results screen |
| `MissedWordsTable` | `components/MissedWordsTable.tsx` | Ranked table of words with incorrect attempt counts |

### App shell

```typescript
// src/App.tsx
type View = 'setup' | 'practice' | 'results';

export default function App() {
  const [view, setView] = useState<View>('setup');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  // callbacks passed down:
  // onStart(config) → setSessionConfig + setView('practice')
  // onComplete(result) → setSessionResult + setView('results')
  // onReset() → clear both + setView('setup')
}
```

---

## 5. Routing

**Decision: No external router. Pure React state.**

**Reasoning:**
The app has exactly three views in a strict, non-branching pipeline: setup → practice → results → setup. There are no shareable URLs (a practice session can't be deep-linked; it requires ephemeral runtime state). There is no browser back-button semantics to honor (going "back" during practice would mean abandoning the session, which should be an explicit action, not a browser affordance). Adding React Router for three sequential views adds boilerplate (`BrowserRouter`, `Route`, `Navigate`, `useNavigate`) with zero user-facing benefit.

A top-level `View` state enum in `App.tsx` is sufficient, unambiguous, and eliminates an entire dependency.

The `public/_redirects` file still needs the SPA catch-all rule for Cloudflare Pages (in case someone lands on a non-root URL edge case), but routing logic itself is pure state.

---

## 6. Practice Mode Details

### JP→EN mode (`JpEnPrompt`)

**Layout (two-panel feel, inspired by Google Translate):**

```
┌─────────────────────────────────────────────────────┐
│  [part of speech chip]                               │
│                                                      │
│  創り出す；引き起こす              ← large, primary  │
│                                                      │
│  [kriˈeɪt]                        ← muted, smaller  │
└─────────────────────────────────────────────────────┘
[ Type the English word...          ] [ Submit ]
```

- Japanese meaning: large font (~24px), dark gray, center-weighted
- Part of speech: small chip (`動詞` etc.), muted blue, top-left
- Pronunciation: monospace or lighter weight, muted gray, below meaning
- No hint of the English word is shown

### EN→EN mode (`EnEnPrompt`)

**Word hiding logic:**

```typescript
// src/utils/sentence.ts

export interface ParsedSentence {
  before: string;
  after: string;
  found: boolean;  // false if target word not found in sentence
}

export function parseSentence(sentence: string, word: string): ParsedSentence {
  // Case-insensitive match for whole word (may be conjugated form)
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  const match = sentence.match(regex);

  if (!match || match.index === undefined) {
    return { before: sentence, after: '', found: false };
  }

  return {
    before: sentence.slice(0, match.index),
    after: sentence.slice(match.index + match[0].length),
    found: true,
  };
}
```

**Visual blank rendering:**

The blank is rendered as an inline element, not raw underscores. It uses a border-bottom to create a fill-in-blank feel proportional to the word length:

```tsx
// Inside EnEnPrompt
const { before, after, found } = parseSentence(word.example_sentence, word.word);

// Blank width: 1ch per character of the target word, min 4ch, max 12ch
const blankWidth = `${Math.min(Math.max(word.word.length, 4), 12)}ch`;

<p className="text-xl leading-relaxed text-gray-800">
  {before}
  <span
    className="inline-block border-b-2 border-gray-500 mx-1 align-bottom"
    style={{ width: blankWidth, marginBottom: '2px' }}
    aria-label="blank"
  />
  {after}
</p>
```

If `found === false` (word does not appear verbatim in the sentence, e.g. due to conjugation), render a fallback:

```tsx
// Fallback: show sentence normally with a separate fill-in indicator
<p className="text-sm text-amber-600 mb-2">Fill in the blank: the answer appears in a different form.</p>
<p className="text-xl leading-relaxed text-gray-800">{word.example_sentence}</p>
```

This is honest to the user — rather than silently hiding nothing, it signals that the form will differ.

### Answer input behavior

- `<input type="text">` auto-focused on each word transition
- Submits on `Enter` key or clicking the Submit button
- Input is cleared after each submission (correct or incorrect)
- Submit button is disabled when the input is empty
- After a correct answer: show green feedback briefly (~800ms), then auto-advance
- After an incorrect answer: show red feedback with the correct answer revealed (~1500ms), then auto-advance
- Auto-advance uses `setTimeout`; if the user presses Enter again before the timer fires, it advances immediately (debounce the input focus)

### Word transitions

No full-screen animation. A simple opacity fade (`transition-opacity duration-200`) on the `WordPrompt` container — fade out on submit, new word fades in. This keeps the interaction feeling snappy without distraction.

---

## 7. Results Screen

### Data received

`ResultsScreen` receives a `SessionResult` object (defined in §2) as a prop. It does not need access to the session hook — all data is pre-computed.

### Computed display values

```typescript
const elapsedMs = result.endTime - result.startTime;
const totalWords = result.completedWords.length;
const totalIncorrect = result.completedWords.reduce((sum, r) => sum + r.incorrectCount, 0);
const totalAttempts = totalWords + totalIncorrect;  // each word was answered correctly once + N incorrect times
const accuracyPct = Math.round((totalWords / totalAttempts) * 100);

// Format elapsed time as M:SS
const minutes = Math.floor(elapsedMs / 60000);
const seconds = Math.floor((elapsedMs % 60000) / 1000);
const elapsedFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
```

### Most-missed ranking

```typescript
const missedWords = result.completedWords
  .filter(r => r.incorrectCount > 0)
  .sort((a, b) => b.incorrectCount - a.incorrectCount);
```

Only words with at least one incorrect attempt appear in the table. If the user answered everything correctly on the first try, show a "Perfect score!" message instead of the table.

### Table columns

| Rank | Word | Meaning (Japanese) | Missed |
|------|------|--------------------|--------|

Rank is 1-indexed by sort order (ties share the same rank, next rank skips — standard competition ranking).

### Layout

```
┌─────────────────────────────────────────────────────┐
│  Session Complete                                    │
│                                                      │
│  [2:34]         [87%]         [50 words]            │
│   Time           Accuracy       Range                │
│                                                      │
│  Words to review (13 words)                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ # │ Word        │ Meaning      │ Missed         │ │
│  │ 1 │ acquire     │ 取得する     │ 3×             │ │
│  │ 2 │ obscure     │ 不明瞭な     │ 2×             │ │
│  │ ... │                                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [ Try Again with same range ] [ New Session ]      │
└─────────────────────────────────────────────────────┘
```

"Try Again with same range" resets the session with the same `SessionConfig`. "New Session" returns to the setup screen.

---

## 8. Design System

### Aesthetic principles (Google Translate-inspired)

- White (`#ffffff`) background everywhere
- Card backgrounds: `bg-white` with `border border-gray-200` — no heavy shadows, just `shadow-sm` at most
- Primary accent: `#1a73e8` (Google blue) — mapped to a Tailwind CSS v4 custom color
- Text hierarchy: `text-gray-900` (headings/primary), `text-gray-600` (secondary), `text-gray-400` (placeholder/muted)
- Border radius: `rounded-xl` for cards/panels, `rounded-lg` for inputs, `rounded-full` for chips/tags
- Typography: system sans-serif stack — Tailwind's default `font-sans` is sufficient; no custom font needed
- Transitions: `transition-all duration-150` for interactive states, `transition-opacity duration-200` for word transitions

### Tailwind CSS v4 config

Tailwind v4 uses CSS-first configuration (no `tailwind.config.js`). Design tokens are defined in the global CSS file:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-blue-google: #1a73e8;
  --color-blue-google-hover: #1557b0;
  --color-blue-google-light: #e8f0fe;
}
```

Usage: `bg-blue-google`, `text-blue-google`, `border-blue-google`, etc.

### Shared patterns

**Primary button:**
```
bg-blue-google text-white rounded-lg px-6 py-2.5 font-medium
hover:bg-blue-google-hover transition-colors duration-150
disabled:opacity-40 disabled:cursor-not-allowed
```

**Card surface:**
```
bg-white border border-gray-200 rounded-xl p-6
```

**Text input:**
```
w-full border border-gray-300 rounded-lg px-4 py-3 text-base
focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent
placeholder:text-gray-400 transition-shadow duration-150
```

**Part-of-speech chip:**
```
inline-block bg-blue-google-light text-blue-google text-xs font-medium
px-2.5 py-0.5 rounded-full
```

**Progress bar:**
```html
<div class="h-1 bg-gray-100 rounded-full overflow-hidden">
  <div class="h-full bg-blue-google transition-all duration-300 rounded-full"
       style="width: {pct}%" />
</div>
```

### Layout

The app is constrained to a max-width of `max-w-2xl mx-auto` — content never spans the full viewport width, preserving the focused, card-like feeling. Vertical centering with `min-h-screen flex flex-col items-center justify-center` on the root.

The top of every screen has a minimal header: site name `webtarget.dev` in small muted text, no nav. During practice, the progress bar lives at the very top of the screen (full-width strip), then the constrained content below.

---

## 9. Cloudflare Pages Setup

### Build configuration

```toml
# No wrangler.toml needed for static Pages deployment
# Configured in Cloudflare dashboard or via CLI:

Build command:    npm run build
Output directory: dist
Root directory:   /  (repo root)
Node version:     20
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
```

### SPA redirect rule

All non-asset requests must return `index.html` (required even without a router, in case users land on a URL with a hash or future paths):

```
# public/_redirects
/*  /index.html  200
```

This file is copied verbatim to `dist/` by Vite (anything in `public/` is copied as-is).

### Gotchas

- **Tailwind v4 peer dep**: Ensure `@tailwindcss/vite` plugin is used (Tailwind v4's Vite integration is `@tailwindcss/vite`, not the PostCSS plugin).
- **words.json bundle size**: 1,900 words at ~200 bytes each ≈ 380KB raw JSON. Vite will bundle this into the JS chunk. This is acceptable; no code-splitting needed. If it becomes a concern, it could be moved to `public/words.json` and fetched at startup — but for now, static import is simpler.
- **`resolveJsonModule`**: Vite handles JSON imports natively; no extra tsconfig flag needed beyond `"moduleResolution": "bundler"`.
- **Custom domain**: Set `webtarget.dev` as the custom domain in the Cloudflare Pages project settings and add the DNS CNAME record.

---

## 10. Todo List

### Phase 1 — Project scaffold

- [ ] `npm create vite@latest . -- --template react-ts` (or equivalent)
- [ ] Install Tailwind CSS v4: `npm install tailwindcss @tailwindcss/vite`
- [ ] Configure `@tailwindcss/vite` in `vite.config.ts`
- [ ] Add `@import "tailwindcss"` and `@theme` block to `src/index.css`
- [ ] Delete Vite boilerplate (default `App.tsx`, `App.css`, `assets/`)
- [ ] Create directory structure: `src/components/`, `src/screens/`, `src/hooks/`, `src/utils/`, `src/data/`, `src/types.ts`
- [ ] Add `public/_redirects` with SPA rule
- [ ] Verify `npm run build` produces a clean `dist/`

### Phase 2 — Data layer

- [ ] Copy `words.json` to `src/data/words.json`
- [ ] Write `src/types.ts` with all interfaces (`Word`, `PracticeMode`, `SessionConfig`, `CompletedResult`, `SessionResult`)
- [ ] Write `src/utils/words.ts` (`getWordsInRange`, `shuffleArray`)
- [ ] Write `src/utils/sentence.ts` (`parseSentence` for EN→EN blank detection)
- [ ] Manually verify `parseSentence` handles: word found, word not found, word mid-sentence, word at start, word at end

### Phase 3 — Session logic

- [ ] Write `src/hooks/useSession.ts` with state shape and all actions
- [ ] Implement `submitAnswer` with correct/incorrect branching
- [ ] Implement re-queue logic (random position, min index 1)
- [ ] Implement completion detection and `SessionResult` construction
- [ ] Verify edge case: single word in range (must loop until correct)
- [ ] Verify edge case: range produces 0 words (should be blocked at setup validation)

### Phase 4 — Setup screen

- [ ] `SetupScreen.tsx` layout (range inputs + mode selector + start button)
- [ ] `RangeInput.tsx`: two number inputs, validate `1 ≤ start ≤ end ≤ 1900`, error messages inline
- [ ] `ModeSelector.tsx`: two option cards (JP→EN, EN→EN) with descriptions; selected state is visually distinct (blue border + bg tint)
- [ ] Disable Start button when validation fails
- [ ] Wire `onStart(config)` callback up to `App.tsx`
- [ ] Apply Google Translate-inspired styles

### Phase 5 — Practice screen

- [ ] `PracticeScreen.tsx`: owns `useSession`, renders current word, handles feedback timing
- [ ] `WordPrompt.tsx`: delegates to `JpEnPrompt` or `EnEnPrompt` based on mode
- [ ] `JpEnPrompt.tsx`: part-of-speech chip, Japanese meaning, pronunciation
- [ ] `EnEnPrompt.tsx`: sentence with styled blank; fallback for unmatched word
- [ ] `AnswerInput.tsx`: text input, submit button, Enter key, auto-focus, disabled-when-empty
- [ ] `FeedbackBanner.tsx`: correct (green, "Correct!") / incorrect (red, "The answer was: {word}") state
- [ ] `ProgressBar.tsx`: full-width strip at top, animated fill
- [ ] `SessionStats.tsx`: live elapsed timer (updates every second via `setInterval`) + word counter
- [ ] Opacity fade transition between words
- [ ] Wire `onComplete(result)` callback up to `App.tsx`

### Phase 6 — Results screen

- [ ] `ResultsScreen.tsx`: layout with three stat cards + table + action buttons
- [ ] `StatCard.tsx`: reusable card (label + large value)
- [ ] Format elapsed time as `M:SS`
- [ ] Compute and display accuracy percentage
- [ ] `MissedWordsTable.tsx`: sorted missed words with rank, word, Japanese meaning, missed count
- [ ] Handle "perfect score" case (no missed words)
- [ ] "Try Again" button: call `onStart` with same config (triggers new session)
- [ ] "New Session" button: call `onReset` to return to setup

### Phase 7 — Design polish

- [ ] Audit all screens against Google Translate aesthetic reference
- [ ] Verify text color hierarchy (gray-900 / gray-600 / gray-400) is consistent
- [ ] Check all interactive states: hover, focus rings, disabled
- [ ] Verify word transitions feel smooth (opacity fade)
- [ ] Test responsive layout at mobile width (375px) and tablet (768px)
- [ ] Verify progress bar animation is smooth
- [ ] Check feedback banners auto-dismiss correctly
- [ ] Review EN→EN blank sizing across different word lengths

### Phase 8 — Quality and correctness

- [ ] Test JP→EN mode end-to-end with a small range (e.g. IDs 1–5)
- [ ] Test EN→EN mode end-to-end with same range
- [ ] Verify case-insensitive judgment (`"Create"` and `"create"` both accepted)
- [ ] Verify whitespace trimming (`" create "` accepted)
- [ ] Verify re-queue logic: word incorrectly answered never immediately repeats
- [ ] Verify completion: session ends exactly when all words answered correctly
- [ ] Verify results accuracy math is correct
- [ ] Test range validation edge cases (start > end, values out of 1–1900)
- [ ] Test with full range (1–1900) to ensure no performance issues

### Phase 9 — Deploy

- [ ] `npm run build` — verify `dist/` is clean, no errors
- [ ] Check `dist/_redirects` exists
- [ ] Create Cloudflare Pages project linked to repo
- [ ] Set build command (`npm run build`) and output directory (`dist`) in Pages settings
- [ ] Set Node.js version to 20 in Pages environment variables
- [ ] Add `webtarget.dev` custom domain in Pages settings
- [ ] Configure DNS: add CNAME `webtarget.dev → <project>.pages.dev` in Cloudflare DNS
- [ ] Trigger deploy and verify production URL loads correctly
- [ ] Verify SPA `_redirects` rule: navigate to any path and confirm it loads `index.html`
- [ ] Smoke test both practice modes on production
