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
    <div className="min-h-screen flex flex-col bg-white">
      <ProgressBar completedCount={completedCount} totalCount={totalCount} />

      <div className="flex flex-col items-center flex-1 px-4 py-6">
        <header className="w-full max-w-2xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">webtarget.dev</span>
            <span className="text-gray-200">|</span>
            <span className="text-xs text-gray-400">{modeLabel}</span>
          </div>
          <div className="flex items-center gap-5 text-sm text-gray-400">
            <ElapsedTimer startTime={startTimeRef.current} />
            <span>{completedCount}<span className="text-gray-300 mx-1">/</span>{totalCount} words</span>
            <span className="text-xs text-gray-300">{queueLength} in queue</span>
          </div>
        </header>

        {currentWord && (
          <div className="w-full max-w-2xl border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-white">
              <WordPrompt word={currentWord} mode={config.mode} />
            </div>
            <div className="bg-surface-gray border-t border-gray-200 p-6">
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
            </div>
          </div>
        )}
      </div>
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
    <div className="flex flex-col gap-4">

      {/* Status label */}
      <p className={`text-[11px] font-semibold uppercase tracking-widest ${
        isCorrect ? 'text-green-600' : 'text-red-500'
      }`}>
        {isCorrect ? '✓  Correct' : '✗  Incorrect'}
      </p>

      {/* Wrong answer — struck through, only on incorrect */}
      {!isCorrect && (
        <p className="text-sm font-mono text-red-400 line-through opacity-80">
          {userInput}
        </p>
      )}

      {/* Word — large, light weight, Google Translate result style */}
      <p className="text-4xl font-light text-gray-800 leading-none tracking-tight">
        {word.word}
      </p>

      {word.pronunciation && (
        <p className="text-sm text-gray-400">{word.pronunciation}</p>
      )}
      <p className="text-xs text-gray-400 italic">{word.part_of_speech}</p>

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="w-full mt-2 bg-blue-google text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-google-hover transition-colors duration-150 cursor-pointer"
      >
        Next →
      </button>
    </div>
  );
}

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = now - startTime;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return <span>{m}:{s.toString().padStart(2, '0')}</span>;
}
