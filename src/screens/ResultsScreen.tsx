import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { SessionResult } from '../types';
import StatCard from '../components/StatCard';
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

  const rangeLabel = `${result.config.start}–${result.config.end}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <p className="text-xs text-gray-400 mb-6 tracking-wide">webtarget.dev</p>
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Session Complete</h1>
          <p className="text-sm text-gray-500">
            {result.config.mode === 'jp-en' ? 'JP → EN' : 'EN → EN'} · IDs {rangeLabel}
          </p>
        </div>

        <div className="flex gap-4">
          <StatCard label="Time" value={elapsedFormatted} />
          <StatCard label="Accuracy" value={`${accuracyPct}%`} />
          <StatCard label="Words" value={String(totalWords)} />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <MissedWordsTable missedWords={missedWords} />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/practice', { state: { config: result.config } })}
            className="flex-1 bg-blue-google text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-google-hover transition-colors duration-150 cursor-pointer"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-6 py-3 font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
          >
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
