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
    <div className="app-screen">
      <div className="app-shell">
        <header className="brand-header">
          <span className="brand-name">webtarget.dev</span>
          <span className="brand-context">Vocabulary Practice</span>
        </header>

        <section className="setup-card">
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

          <div className="setup-content">
            <div className="setup-config">
              <div>
                <p className="section-label">Word ID Range</p>
                <div className="range-grid">
                  <div className="range-field">
                    <label className="range-field-label" htmlFor="range-start">
                      Start
                    </label>
                    <input
                      id="range-start"
                      type="number"
                      min={1}
                      max={1900}
                      value={start}
                      onChange={e => setStart(Number(e.target.value))}
                      className="range-input"
                    />
                  </div>
                  <span className="range-separator" aria-hidden="true">
                    —
                  </span>
                  <div className="range-field">
                    <label className="range-field-label" htmlFor="range-end">
                      End
                    </label>
                    <input
                      id="range-end"
                      type="number"
                      min={1}
                      max={1900}
                      value={end}
                      onChange={e => setEnd(Number(e.target.value))}
                      className="range-input"
                    />
                  </div>
                </div>
                {rangeError && <p className="form-error">{rangeError}</p>}
              </div>

              <div>
                <p className="section-label">Mode</p>
                <p className="mode-help">
                  {mode === 'jp-en'
                    ? 'See Japanese meaning, type the English word.'
                    : 'See an English sentence with a blank, then fill in the missing word.'}
                </p>
              </div>
            </div>

            <aside className="setup-summary" aria-live="polite">
              {!rangeError ? (
                <>
                  <div>
                    <p className="summary-count">{wordCount}</p>
                    <p className="summary-label">words selected</p>
                  </div>
                  <div>
                    <span className="summary-badge">
                      IDs {start}–{end}
                    </span>
                  </div>
                </>
              ) : (
                <p className="summary-placeholder">Enter a valid range to continue.</p>
              )}
            </aside>
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

        <p className="subtle-footnote">{words.length.toLocaleString()} words available</p>
      </div>
    </div>
  );
}
