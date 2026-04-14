import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Word, SessionConfig, PracticeMode } from '../types';
import { getWordsInRange } from '../utils/words';

interface Props {
  words: Word[];
}

function validateRange(start: number, end: number, words: Word[]): string | null {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return 'Enter whole numbers';
  if (start < 1 || start > 1900) return 'Start must be 1–1900';
  if (end < 1 || end > 1900) return 'End must be 1–1900';
  if (start > end) return 'Start must be ≤ end';
  if (getWordsInRange(words, start, end).length === 0) return 'No words in this range';
  return null;
}

export default function SetupScreen({ words }: Props) {
  const navigate = useNavigate();
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [mode, setMode] = useState<PracticeMode>('jp-en');

  const rangeError = validateRange(start, end, words);
  const wordCount = rangeError ? 0 : getWordsInRange(words, start, end).length;

  function handleStart() {
    if (rangeError) return;
    const config: SessionConfig = { start, end, mode };
    navigate('/practice', { state: { config } });
  }

  const modes: { value: PracticeMode; label: string }[] = [
    { value: 'jp-en', label: 'JP → EN' },
    { value: 'en-en', label: 'EN → EN' },
  ];

  return (
    <div className="app-screen setup-screen">
      <div className="app-shell setup-shell">
        <header className="brand-header">
          <span className="brand-name">webtarget.dev</span>
          <span className="brand-context">Vocabulary Practice</span>
        </header>

        <section className="setup-card setup-flow">
          <div className="mode-toggle" role="tablist" aria-label="Practice mode">
            {modes.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`mode-toggle-button ${mode === m.value ? 'mode-toggle-button-active' : ''}`}
                role="tab"
                aria-selected={mode === m.value}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="setup-config">
            <div>
              <div className="range-grid setup-range-grid">
                <div className="range-field setup-range-field">
                  <input
                    id="range-start"
                    type="number"
                    min={1}
                    max={1900}
                    value={start}
                    onChange={e => setStart(Number(e.target.value))}
                    className="range-input"
                    aria-label="Start word ID"
                    placeholder="Start"
                  />
                </div>
                <span className="range-separator" aria-hidden="true">
                  —
                </span>
                <div className="range-field setup-range-field">
                  <input
                    id="range-end"
                    type="number"
                    min={1}
                    max={1900}
                    value={end}
                    onChange={e => setEnd(Number(e.target.value))}
                    className="range-input"
                    aria-label="End word ID"
                    placeholder="End"
                  />
                </div>
              </div>
              {rangeError ? (
                <p className="form-error">{rangeError}</p>
              ) : (
                <p className="setup-selection-line" aria-live="polite">
                  {wordCount} words · IDs {start}–{end}
                </p>
              )}
            </div>

            <p className="mode-help">
              {mode === 'jp-en'
                ? 'See Japanese meaning, type the English word.'
                : 'See an English sentence with a blank, then fill in the missing word.'}
            </p>
          </div>

          <button
            type="button"
            disabled={rangeError !== null}
            onClick={handleStart}
            className="button-primary start-button"
          >
            Start Practice
          </button>
        </section>
      </div>
    </div>
  );
}
