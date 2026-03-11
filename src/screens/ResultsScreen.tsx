import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { SessionResult } from '../types';
import MissedWordsTable from '../components/MissedWordsTable';

export default function ResultsScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result as SessionResult | undefined;

  if (!result) return <Navigate to="/" replace />;

  const elapsedMs = result.endTime - result.startTime;
  const totalWords = result.completedWords.length;
  const totalIncorrect = result.completedWords.reduce((sum, r) => sum + r.incorrectCount, 0);
  const totalAttempts = totalWords + totalIncorrect;
  const accuracyPct = Math.round((totalWords / totalAttempts) * 100);
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const elapsedFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const missedWords = result.completedWords
    .filter(r => r.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount);

  const modeLabel = result.config.mode === 'jp-en' ? 'JP → EN' : 'EN → EN';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-10">
      <header className="w-full max-w-4xl mb-6 flex items-center gap-3">
        <span className="text-base font-medium text-gray-700 tracking-tight">webtarget.dev</span>
        <span className="text-gray-300 text-sm">Session Complete</span>
      </header>

      <div className="w-full max-w-4xl border border-gray-200 rounded-2xl overflow-hidden">
        {/* Stats row — google-translate header style */}
        <div className="bg-surface-gray border-b border-gray-200 px-8 py-5 flex items-center gap-10">
          <div>
            <p className="text-2xl font-semibold text-gray-900">{elapsedFormatted}</p>
            <p className="text-xs text-gray-500 mt-0.5">Time</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{accuracyPct}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Accuracy</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div>
            <p className="text-2xl font-semibold text-gray-900">{totalWords}</p>
            <p className="text-xs text-gray-500 mt-0.5">Words</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">{modeLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">IDs {result.config.start}–{result.config.end}</p>
          </div>
        </div>

        {/* Missed words table */}
        <div className="bg-white p-8">
          <MissedWordsTable missedWords={missedWords} />
        </div>

        {/* Actions */}
        <div className="bg-surface-gray border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="border border-gray-200 text-gray-600 rounded-lg px-5 py-2 text-sm font-medium hover:border-gray-300 hover:bg-white transition-colors duration-150 cursor-pointer"
          >
            New Session
          </button>
          <button
            type="button"
            onClick={() => navigate('/practice', { state: { config: result.config } })}
            className="bg-blue-google text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-google-hover transition-colors duration-150 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
