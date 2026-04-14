import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { Word, SessionConfig } from '../types';
import { useSession } from '../hooks/useSession';
import ProgressBar from '../components/ProgressBar';
import WordPrompt from '../components/WordPrompt';
import AnswerInput from '../components/AnswerInput';

interface Props {
  words: Word[];
}

export default function PracticeScreen({ words }: Props) {
  const { state } = useLocation();
  const config = state?.config as SessionConfig | undefined;
  if (!config) return <Navigate to="/" replace />;
  return <PracticeSession words={words} config={config} />;
}

type CardState =
  | { phase: 'idle' }
  | { phase: 'feedback'; word: Word; userInput: string; isCorrect: boolean };

function PracticeSession({ words, config }: { words: Word[]; config: SessionConfig }) {
  const navigate = useNavigate();
  const { currentWord, queueLength, completedCount, totalCount, evaluateAnswer, advance, result } =
    useSession(words, config);

  const [input, setInput] = useState('');
  const [card, setCard] = useState<CardState>({ phase: 'idle' });
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (result) navigate('/results', { state: { result }, replace: true });
  }, [result, navigate]);

  // Enter key advances from feedback → idle. useEffect fires after paint (async),
  // so the original submit-Enter's full keydown→keyup cycle is done before this listener
  // is ever added — no accidental advance from the submit action.
  useEffect(() => {
    if (card.phase !== 'feedback') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      if (e.target instanceof HTMLInputElement) return;
      handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  function handleSubmit() {
    if (!currentWord || input.trim() === '') return;
    const outcome = evaluateAnswer(input);
    setCard({ phase: 'feedback', word: currentWord, userInput: input, isCorrect: outcome === 'correct' });
  }

  function handleNext() {
    if (card.phase !== 'feedback') return;
    advance(card.isCorrect);
    setCard({ phase: 'idle' });
    setInput('');
  }

  const modeLabel = config.mode === 'jp-en' ? 'JP → EN' : 'EN → EN';

  return (
    <div className="practice-screen">
      <div className="practice-sticky">
        <header className="practice-header">
          <div className="practice-brand">
            <span className="practice-brand-name">webtarget.dev</span>
            <span className="practice-mode">{modeLabel}</span>
          </div>

          <div className="practice-stats">
            <div className="header-metric">
              <ElapsedTimer startTime={startTimeRef.current} className="header-metric-value" />
              <span className="header-metric-label">elapsed</span>
            </div>
            <div className="header-metric">
              <span className="header-metric-value">{completedCount}/{totalCount}</span>
              <span className="header-metric-label">words</span>
            </div>
            <div className="header-metric">
              <span className="header-metric-value">{queueLength}</span>
              <span className="header-metric-label">queue</span>
            </div>
          </div>
        </header>
        <ProgressBar completedCount={completedCount} totalCount={totalCount} />
      </div>

      <main className="practice-main">
        {currentWord && (
          <>
            <section className="question-card">
              <WordPrompt word={currentWord} mode={config.mode} />
            </section>

            <section className="answer-area">
              {card.phase === 'feedback' ? (
                <ReviewPanel
                  word={card.word}
                  userInput={card.userInput}
                  isCorrect={card.isCorrect}
                  onNext={handleNext}
                />
              ) : (
                <AnswerInput value={input} onChange={setInput} onSubmit={handleSubmit} />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

interface ReviewPanelProps {
  word: Word;
  userInput: string;
  isCorrect: boolean;
  onNext: () => void;
}

function ReviewPanel({ word, userInput, isCorrect, onNext }: ReviewPanelProps) {
  return (
    <div className="review-panel">
      <p className={`review-status ${isCorrect ? 'review-status-correct' : 'review-status-incorrect'}`}>
        <span className="review-status-icon" aria-hidden="true">
          {isCorrect ? '✓' : '✕'}
        </span>
        <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
      </p>

      {!isCorrect && (
        <p className="review-incorrect-input">{userInput}</p>
      )}

      <p className={`review-answer ${isCorrect ? 'review-answer-correct' : 'review-answer-incorrect'}`}>
        {isCorrect ? word.word : `Answer: ${word.word}`}
      </p>

      <p className="review-meta">
        {word.pronunciation ? `[${word.pronunciation}] · ` : ''}
        {word.part_of_speech}
      </p>

      <button
        type="button"
        onClick={onNext}
        className="button-primary next-button"
      >
        Next →
      </button>
    </div>
  );
}

function ElapsedTimer({ startTime, className }: { startTime: number; className?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = now - startTime;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return <span className={className}>{m}:{s.toString().padStart(2, '0')}</span>;
}
