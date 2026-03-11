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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-10">
      <header className="w-full max-w-4xl mb-6 flex items-center gap-3">
        <span className="text-base font-medium text-gray-700 tracking-tight">webtarget.dev</span>
        <span className="text-gray-300 text-sm">Vocabulary Practice</span>
      </header>

      <div className="w-full max-w-4xl border border-gray-200 rounded-2xl overflow-hidden">
        {/* Mode tabs — span full width like Google Translate language tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {modes.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`relative px-6 py-3 text-sm font-medium transition-colors duration-150 cursor-pointer ${
                mode === m.value
                  ? 'text-blue-google'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {m.label}
              {mode === m.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-google rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Two-panel body */}
        <div className="flex min-h-[320px]">
          {/* Left: config (white) */}
          <div className="flex-1 p-8 flex flex-col gap-6 border-r border-gray-200">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Word ID Range</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1.5">Start</label>
                  <input
                    type="number"
                    min={1}
                    max={1900}
                    value={start}
                    onChange={e => setStart(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent transition-shadow duration-150 bg-white"
                  />
                </div>
                <span className="text-gray-300 text-xl mt-5">–</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1.5">End</label>
                  <input
                    type="number"
                    min={1}
                    max={1900}
                    value={end}
                    onChange={e => setEnd(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent transition-shadow duration-150 bg-white"
                  />
                </div>
              </div>
              {rangeError && <p className="text-xs text-red-500 mt-2">{rangeError}</p>}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Mode</p>
              <p className="text-sm text-gray-400">
                {mode === 'jp-en'
                  ? 'See Japanese meaning, type the English word'
                  : 'See an English sentence with a blank, fill it in'}
              </p>
            </div>
          </div>

          {/* Right: summary + start (light gray) */}
          <div className="w-72 flex-shrink-0 bg-surface-gray p-8 flex flex-col justify-between">
            <div>
              {!rangeError ? (
                <>
                  <p className="text-3xl font-semibold text-gray-900">{wordCount}</p>
                  <p className="text-sm text-gray-500 mt-1">words selected</p>
                  <p className="text-xs text-gray-400 mt-4">IDs {start}–{end}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Enter a valid range to continue</p>
              )}
            </div>

            <button
              type="button"
              disabled={rangeError !== null}
              onClick={handleStart}
              className="w-full bg-blue-google text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-blue-google-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer mt-6"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-300 mt-6">{words.length.toLocaleString()} words available</p>
    </div>
  );
}
