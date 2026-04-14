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
  const firstTryCorrect = result.completedWords.filter(r => r.incorrectCount === 0).length;
  const accuracyPct = Math.round((totalWords / totalAttempts) * 100);
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const elapsedFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const missedWords = result.completedWords
    .filter(r => r.incorrectCount > 0)
    .sort((a, b) => b.incorrectCount - a.incorrectCount);

  const modeLabel = result.config.mode === 'jp-en' ? 'JP → EN' : 'EN → EN';
  const accuracyClass = accuracyPct >= 70
    ? 'results-accuracy-good'
    : accuracyPct >= 50
      ? 'results-accuracy-warn'
      : 'results-accuracy-bad';

  return (
    <div className="app-screen results-screen">
      <div className="app-shell results-shell">
        <header className="brand-header">
          <span className="brand-name">webtarget.dev</span>
          <span className="brand-context">Session Complete</span>
        </header>

        <section className="results-card">
          <div className="results-summary">
            <p className="results-score-label">Session Score</p>
            <p className="results-score-value">
              {firstTryCorrect} / {totalWords}
            </p>
            <p className={`results-accuracy ${accuracyClass}`}>
              {accuracyPct}%
            </p>
            <p className="results-meta">
              {elapsedFormatted} · {modeLabel} · IDs {result.config.start}–{result.config.end}
            </p>
          </div>

          <div className="results-metrics">
            <div className="metric-card">
              <p className="metric-label">Time</p>
              <p className="metric-value">{elapsedFormatted}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Total Attempts</p>
              <p className="metric-value">{totalAttempts}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Words Missed</p>
              <p className="metric-value">{missedWords.length}</p>
            </div>
          </div>

          <div className="results-table-section">
            <MissedWordsTable missedWords={missedWords} />
          </div>

          <div className="results-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="button-ghost results-action-button"
            >
              Back to Setup
            </button>
            <button
              type="button"
              onClick={() => navigate('/practice', { state: { config: result.config } })}
              className="button-primary results-action-button"
            >
              Practice Again
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
