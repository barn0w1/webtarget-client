# Vocabulary Practice SPA — Implementation Plan

## 1. Project Summary

A single-page application for practicing English vocabulary deployed to `webtarget.dev` on Cloudflare Pages.

**End-to-end flow:**

1. **Loading state** — on first paint, the app fetches `words.json` from the CDN. A minimal spinner is shown until the data is ready.
2. **Setup screen** — user selects a word ID range (1–1900) and a practice mode (JP→EN or EN→EN), then starts a session.
3. **Practice screen** — words from the selected range are shuffled into a queue. The user is shown a prompt and types the English word. Correct answers remove the word from the queue permanently; incorrect answers reinsert the word at a random later position. The session ends only when every word has been answered correctly at least once.
4. **Results screen** — shows total elapsed time, accuracy rate (correct attempts / total attempts), and a ranked table of words the user missed most often, sorted descending by incorrect attempt count.

No backend. No authentication. No localStorage. All state is ephemeral React state that resets on page reload.

---

## 2. Data Layer

### File location

```
public/words.json
```

`words.json` is 524KB and must not be bundled into the JS chunk. It lives in `public/` so Vite copies it verbatim to `dist/words.json`, and the app fetches it at startup. No static JSON import anywhere in the source.

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

### Data-loading hook

```typescript
// src/hooks/useWords.ts

export interface WordsState {
  words: Word[] | null;
  loading: boolean;
  error: string | null;
}

export function useWords(): WordsState {
  const [state, setState] = useState<WordsState>({ words: null, loading: true, error: null });

  useEffect(() => {
    fetch('/words.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load words (${res.status})`);
        return res.json() as Promise<Word[]>;
      })
      .then(words => setState({ words, loading: false, error: null }))
      .catch(err => setState({ words: null, loading: false, error: String(err.message) }));
  }, []);

  return state;
}
```

### Utility functions

```typescript
// src/utils/words.ts
// No JSON import — words are passed in from the loaded dataset.

export function getWordsInRange(allWords: Word[], start: number, end: number): Word[] {
  return allWords.filter(w => w.id >= start && w.id <= end);
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
1. `allWords = getWordsInRange(words, config.start, config.end)` (words from the loaded dataset)
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
function useSession(words: Word[], config: SessionConfig): {
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
| `LoadingScreen` | `screens/LoadingScreen.tsx` | Minimal spinner shown while `words.json` is fetching |
| `ErrorScreen` | `screens/ErrorScreen.tsx` | Displayed if the words fetch fails; shows message + retry button |
| `SetupScreen` | `screens/SetupScreen.tsx` | Range inputs, mode selector, start button |
| `PracticeScreen` | `screens/PracticeScreen.tsx` | Orchestrates practice session; owns `useSession`; reads `config` from React Router location state |
| `ResultsScreen` | `screens/ResultsScreen.tsx` | Displays elapsed time, accuracy, missed-words table; reads `result` from React Router location state |

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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWords } from './hooks/useWords';

export default function App() {
  const { words, loading, error } = useWords();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SetupScreen words={words!} />} />
        <Route path="/practice" element={<PracticeScreen words={words!} />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Session data (config, result) travels via React Router location state — no global state manager needed.

---

## 5. Routing

**Decision: React Router v6 (`react-router-dom`).**

### Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `SetupScreen` | Always reachable; shown after fetch completes |
| `/practice` | `PracticeScreen` | Expects `{ config: SessionConfig }` in location state |
| `/results` | `ResultsScreen` | Expects `{ result: SessionResult }` in location state |
| `*` | `<Navigate to="/" replace />` | Catch-all redirect |

### Navigation flow

- **SetupScreen → practice**: `navigate('/practice', { state: { config } })`
- **PracticeScreen → results**: `navigate('/results', { state: { result }, replace: true })` — `replace: true` so the back button skips the completed practice session and goes straight to setup
- **ResultsScreen → new session**: `navigate('/')` on "New Session"
- **ResultsScreen → retry**: `navigate('/practice', { state: { config: result.config } })` on "Try Again"

### Guard behavior

If a user lands on `/practice` or `/results` without valid location state (e.g., page refresh), the component redirects to setup:

```typescript
// PracticeScreen
const { state } = useLocation();
const config = state?.config as SessionConfig | undefined;
if (!config) return <Navigate to="/" replace />;

// ResultsScreen
const { state } = useLocation();
const result = state?.result as SessionResult | undefined;
if (!result) return <Navigate to="/" replace />;
```

### Why React Router v6?

The URL reflects where the user is in the flow (`/practice` vs `/results` vs `/`). The browser back button works intuitively: back from results returns to setup. Page reload on any path bounces to setup gracefully rather than rendering a broken state. The cost is one dependency and a `<BrowserRouter>` wrapper — the architecture remains simple.

Session state is intentionally not encoded in URLs. A practice session cannot be deep-linked (it requires ephemeral runtime state), and attempting to serialize it would add complexity with no real benefit. Refreshing mid-session returns to setup, which is correct.

The `public/_redirects` SPA catch-all rule is still required for Cloudflare Pages to return `index.html` for all non-asset paths.

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

**Word hiding logic — token-based fuzzy matching:**

Example sentences often contain inflected forms of the target word (`create` → `creating`, `acquired`, `obscures`). An exact `\bword\b` regex fails for these, producing too many fallbacks. Instead, `parseSentence` uses a token-based approach: it finds the sentence token most similar to the target word by prefix overlap, then blanks that token regardless of its exact form.

```typescript
// src/utils/sentence.ts

export interface ParsedSentence {
  before: string;        // text before the blanked token
  blankedToken: string;  // the actual sentence token that was removed (used for blank width)
  after: string;         // text after the blanked token
  found: boolean;        // false if no sufficiently similar token was found
}

export function parseSentence(sentence: string, word: string): ParsedSentence {
  // Split into alternating [gap, word-token, gap, word-token, ...] pairs.
  // Odd-indexed entries are word tokens; even-indexed are gaps/punctuation.
  const tokens = sentence.split(/(\b\w+\b)/);
  const targetLower = word.toLowerCase();

  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!/^\w+$/.test(token)) continue; // skip gaps

    const tokenLower = token.toLowerCase();

    // Exact match: take it immediately
    if (tokenLower === targetLower) {
      bestIndex = i;
      bestScore = 1;
      break;
    }

    // Prefix overlap: one string starts with the other (handles -ing, -ed, -s, -er, -ly forms)
    const shorter = tokenLower.length <= targetLower.length ? tokenLower : targetLower;
    const longer  = tokenLower.length <= targetLower.length ? targetLower : tokenLower;

    if (longer.startsWith(shorter)) {
      const score = shorter.length / longer.length;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }

  // Require at least 50% overlap to avoid false positives on short common words
  if (bestIndex === -1 || bestScore < 0.5) {
    return { before: sentence, blankedToken: word, after: '', found: false };
  }

  const blankedToken = tokens[bestIndex];
  const before = tokens.slice(0, bestIndex).join('');
  const after  = tokens.slice(bestIndex + 1).join('');

  return { before, blankedToken, after, found: true };
}
```

**Coverage:** handles plurals (`-s`), progressive (`-ing`), past (`-ed`), comparative (`-er`), nominal (`-tion`, `-ness`) as long as the base word is a prefix of the inflected form. Irregular forms (`go` → `went`) fall through to the `found: false` fallback.

**Visual blank rendering:**

The blank is rendered as an inline element proportional to the matched token's length, not the base word's length:

```tsx
// Inside EnEnPrompt
const { before, blankedToken, after, found } = parseSentence(word.example_sentence, word.word);

// Blank width: 1ch per character of the blanked token, min 4ch, max 12ch
const blankWidth = `${Math.min(Math.max(blankedToken.length, 4), 12)}ch`;

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

If `found === false` (no sufficiently similar token found), render a fallback:

```tsx
<p className="text-sm text-amber-600 mb-2">Fill in the blank: the answer appears in a different form.</p>
<p className="text-xl leading-relaxed text-gray-800">{word.example_sentence}</p>
```

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

`ResultsScreen` reads a `SessionResult` object from React Router location state (`useLocation().state?.result`). If it is absent (e.g., page refresh), the component redirects to `/`. It does not need access to the session hook — all data is pre-computed.

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

"Try Again with same range" navigates to `/practice` with the same `SessionConfig` in location state. "New Session" navigates to `/`.

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
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
  },
});
```

### SPA redirect rule

All non-asset requests must return `index.html` so React Router can handle client-side routing:

```
# public/_redirects
/*  /index.html  200
```

This file is copied verbatim to `dist/` by Vite (anything in `public/` is copied as-is), alongside `dist/words.json`.

### Gotchas

- **Tailwind v4 peer dep**: Use `@tailwindcss/vite` as the Vite plugin (not the PostCSS plugin). Import it in `vite.config.ts` and add `@import "tailwindcss"` in CSS — no `tailwind.config.js`.
- **`words.json` must be in `public/`**: Vite will copy `public/words.json` → `dist/words.json` automatically. Verify `dist/words.json` exists after build before deploying.
- **`words.json` fetch on Cloudflare**: The `_redirects` catch-all only applies to HTML requests. Static assets (`/words.json`) are served directly by Pages and are not affected by the `/*  /index.html  200` rule.
- **Custom domain**: Set `webtarget.dev` as the custom domain in the Cloudflare Pages project settings and add the DNS CNAME record.

---

## 10. Todo List

### Phase 1 — Project scaffold

- [x] `npm create vite@latest . -- --template react-ts` (or equivalent)
- [x] Install Tailwind CSS v4: `npm install tailwindcss @tailwindcss/vite`
- [x] Install React Router v6: `npm install react-router-dom`
- [x] Configure `@tailwindcss/vite` plugin in `vite.config.ts`
- [x] Add `@import "tailwindcss"` and `@theme` block to `src/index.css`
- [x] Delete Vite boilerplate (default `App.tsx`, `App.css`, `assets/`)
- [x] Create directory structure: `src/components/`, `src/screens/`, `src/hooks/`, `src/utils/`, `src/types.ts`
- [x] Add `public/_redirects` with SPA rule
- [x] Verify `npm run build` produces a clean `dist/`

### Phase 2 — Data layer

- [x] Move `words.json` to `public/words.json` (not `src/data/`)
- [x] Write `src/types.ts` with all interfaces (`Word`, `PracticeMode`, `SessionConfig`, `CompletedResult`, `SessionResult`)
- [x] Write `src/hooks/useWords.ts` (fetch `/words.json`, return `{ words, loading, error }`)
- [x] Write `src/utils/words.ts` (`getWordsInRange(allWords, start, end)`, `shuffleArray`) — no JSON import
- [x] Write `src/utils/sentence.ts` (`parseSentence` with token-based fuzzy matching)
- [x] Manually verify `parseSentence` handles: exact match, `-ing` form, `-ed` form, word not found, word at start of sentence, word at end of sentence
- [x] Verify `dist/words.json` exists after `npm run build`

### Phase 3 — Session logic

- [x] Write `src/hooks/useSession.ts` with state shape and all actions; signature: `useSession(words: Word[], config: SessionConfig)`
- [x] Implement `submitAnswer` with correct/incorrect branching
- [x] Implement re-queue logic (random position, min index 1)
- [x] Implement completion detection and `SessionResult` construction
- [x] Verify edge case: single word in range (must loop until correct)
- [x] Verify edge case: range produces 0 words (should be blocked at setup validation)

### Phase 4 — App shell + loading

- [x] `App.tsx`: `useWords()` hook, loading/error guards, `<BrowserRouter>` + `<Routes>` with all four routes
- [x] `LoadingScreen.tsx`: minimal centered spinner with `webtarget.dev` header
- [x] `ErrorScreen.tsx`: shows error message + retry button (reloads page)

### Phase 5 — Setup screen

- [x] `SetupScreen.tsx` layout (range inputs + mode selector + start button); receives `words` prop
- [x] `RangeInput.tsx`: two number inputs, validate `1 ≤ start ≤ end ≤ 1900`, error messages inline
- [x] `ModeSelector.tsx`: two option cards (JP→EN, EN→EN) with descriptions; selected state is visually distinct (blue border + bg tint)
- [x] Disable Start button when validation fails
- [x] On Start: `navigate('/practice', { state: { config } })`
- [x] Apply Google Translate-inspired styles

### Phase 6 — Practice screen

- [x] `PracticeScreen.tsx`: reads `config` from `useLocation().state`; redirects to `/` if absent; owns `useSession(words, config)`, handles feedback timing
- [x] `WordPrompt.tsx`: delegates to `JpEnPrompt` or `EnEnPrompt` based on mode
- [x] `JpEnPrompt.tsx`: part-of-speech chip, Japanese meaning, pronunciation
- [x] `EnEnPrompt.tsx`: sentence with styled blank using `parseSentence`; fallback for unmatched word
- [x] `AnswerInput.tsx`: text input, submit button, Enter key, auto-focus, disabled-when-empty
- [x] `FeedbackBanner.tsx`: correct (green, "Correct!") / incorrect (red, "The answer was: {word}") state
- [x] `ProgressBar.tsx`: full-width strip at top, animated fill
- [x] `SessionStats.tsx`: live elapsed timer (updates every second via `setInterval`) + word counter
- [x] Opacity fade transition between words
- [x] On complete: `navigate('/results', { state: { result }, replace: true })`

### Phase 7 — Results screen

- [x] `ResultsScreen.tsx`: reads `result` from `useLocation().state`; redirects to `/` if absent
- [x] `StatCard.tsx`: reusable card (label + large value)
- [x] Format elapsed time as `M:SS`
- [x] Compute and display accuracy percentage
- [x] `MissedWordsTable.tsx`: sorted missed words with rank, word, Japanese meaning, missed count
- [x] Handle "perfect score" case (no missed words)
- [x] "Try Again" button: `navigate('/practice', { state: { config: result.config } })`
- [x] "New Session" button: `navigate('/')`

### Phase 8 — Design polish

- [x] Audit all screens against Google Translate aesthetic reference
- [x] Verify text color hierarchy (gray-900 / gray-600 / gray-400) is consistent
- [x] Check all interactive states: hover, focus rings, disabled
- [x] Verify word transitions feel smooth (opacity fade)
- [ ] Test responsive layout at mobile width (375px) and tablet (768px)
- [x] Verify progress bar animation is smooth
- [x] Check feedback banners auto-dismiss correctly
- [x] Review EN→EN blank sizing across different word lengths

### Phase 9 — Quality and correctness

- [ ] Test JP→EN mode end-to-end with a small range (e.g. IDs 1–5)
- [ ] Test EN→EN mode end-to-end with same range
- [x] Verify case-insensitive judgment (`"Create"` and `"create"` both accepted)
- [x] Verify whitespace trimming (`" create "` accepted)
- [x] Verify re-queue logic: word incorrectly answered never immediately repeats
- [x] Verify completion: session ends exactly when all words answered correctly
- [x] Verify results accuracy math is correct
- [x] Test range validation edge cases (start > end, values out of 1–1900)
- [ ] Test with full range (1–1900) to ensure no performance issues
- [x] Test `parseSentence` with conjugated forms from actual `words.json` entries (spot-check 10+ words)
- [x] Test browser back button from results screen (should return to setup, skipping practice)
- [x] Test page refresh on `/practice` (should redirect to `/`)
- [x] Test page refresh on `/results` (should redirect to `/`)

### Phase 10 — Deploy

- [x] `npm run build` — verify `dist/` is clean, no errors
- [x] Check `dist/_redirects` exists
- [x] Check `dist/words.json` exists and is ~524KB
- [ ] Create Cloudflare Pages project linked to repo
- [ ] Set build command (`npm run build`) and output directory (`dist`) in Pages settings
- [ ] Set Node.js version to 20 in Pages environment variables
- [ ] Add `webtarget.dev` custom domain in Pages settings
- [ ] Configure DNS: add CNAME `webtarget.dev → <project>.pages.dev` in Cloudflare DNS
- [ ] Trigger deploy and verify production URL loads correctly
- [ ] Verify `words.json` loads from CDN (check Network tab; should be a separate request, not bundled)
- [ ] Verify SPA `_redirects` rule: navigate to `/practice` directly and confirm it loads `index.html`
- [ ] Smoke test both practice modes on production

---

## Implementation Notes

- **Two-panel layout adopted for all screens** — SetupScreen, PracticeScreen, and ResultsScreen all use a white-left / `#f8f9fa`-right split mirroring Google Translate's visual structure. The left panel holds the source content (config or word prompt); the right panel holds the action area (session summary + start, or answer input + feedback, or stats + actions).

- **Mode tabs inlined into SetupScreen** — The plan called for a separate `ModeSelector` component. During implementation the tabs were inlined directly into `SetupScreen` using the Google Translate tab-with-underline pattern. The separate `ModeSelector.tsx` component still exists as a standalone file but is no longer used by SetupScreen.

- **`StatCard` component created but not used in final ResultsScreen** — The plan called for a `StatCard` component for the results stats row. The final ResultsScreen uses an inline stats bar styled as a panel header instead, which integrates more naturally into the two-panel card. `StatCard.tsx` remains in `src/components/` and is unused.

- **`SessionStats` component inlined in PracticeScreen** — Rather than using the standalone `SessionStats.tsx` component, PracticeScreen embeds an `ElapsedTimer` helper function inline and formats the counter inline. `SessionStats.tsx` remains in `src/components/` but is unused. Both components can be removed if desired.

- **`design system: --color-surface-gray` added** — The plan's `@theme` block did not include `#f8f9fa`. Added `--color-surface-gray: #f8f9fa` to `src/index.css` to support the two-panel layout.

- **`AnswerInput` no longer accepts a `disabled` prop** — The plan included `disabled-when-empty` as a requirement. The final implementation disables the *Submit button* when the input is empty but does not disable the input field itself. The Enter key still submits (or advances) on any keypress; the parent handler in `PracticeScreen` guards against empty submission.

- **Build output: 249KB JS, 20KB CSS** — `words.json` (524KB) is separate. The JS bundle is within normal range for a React + React Router app.
