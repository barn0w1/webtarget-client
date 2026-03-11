import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Word, SessionConfig, PracticeMode } from '../types';
import RangeInput from '../components/RangeInput';
import ModeSelector from '../components/ModeSelector';
import { getWordsInRange } from '../utils/words';

interface Props {
  words: Word[];
}

function validateRange(start: number, end: number, words: Word[]): string | null {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return 'Start and end must be whole numbers';
  if (start < 1 || start > 1900) return 'Start must be between 1 and 1900';
  if (end < 1 || end > 1900) return 'End must be between 1 and 1900';
  if (start > end) return 'Start must be less than or equal to end';
  const count = getWordsInRange(words, start, end).length;
  if (count === 0) return 'No words found in this range';
  return null;
}

export default function SetupScreen({ words }: Props) {
  const navigate = useNavigate();
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(100);
  const [mode, setMode] = useState<PracticeMode>('jp-en');

  const rangeError = validateRange(start, end, words);

  function handleStart() {
    if (rangeError) return;
    const config: SessionConfig = { start, end, mode };
    navigate('/practice', { state: { config } });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <p className="text-xs text-gray-400 mb-8 tracking-wide">webtarget.dev</p>
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Vocabulary Practice</h1>
        <p className="text-gray-500 text-sm mb-8">
          {words.length.toLocaleString()} words available (IDs 1–1900)
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <RangeInput
            start={start}
            end={end}
            onChange={(s, e) => { setStart(s); setEnd(e); }}
            error={rangeError}
          />
          <ModeSelector value={mode} onChange={setMode} />
          <button
            type="button"
            disabled={rangeError !== null}
            onClick={handleStart}
            className="w-full bg-blue-google text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-google-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Start Practice
            {!rangeError && (
              <span className="ml-2 text-blue-google-light text-sm">
                ({getWordsInRange(words, start, end).length} words)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
