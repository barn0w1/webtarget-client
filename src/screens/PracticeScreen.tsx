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
  | { phase: 'feedback'; userInput: string; correctAnswer: string; isCorrect: boolean };

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

  function handleSubmit() {
    if (!currentWord || input.trim() === '') return;
    const outcome = evaluateAnswer(input);
    setCard({
      phase: 'feedback',
      userInput: input,
      correctAnswer: currentWord.word,
      isCorrect: outcome === 'correct',
    });
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
        <header className="w-full max-w-4xl mb-4 flex items-center justify-between">
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
          <div className="w-full max-w-4xl border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex min-h-[300px]">
              <div className="flex-1 border-r border-gray-200 bg-white">
                <WordPrompt word={currentWord} mode={config.mode} />
              </div>
              <div className="w-80 flex-shrink-0 bg-surface-gray p-6 flex flex-col gap-4">
                {card.phase === 'feedback' ? (
                  <ReviewPanel
                    userInput={card.userInput}
                    correctAnswer={card.correctAnswer}
                    isCorrect={card.isCorrect}
                    onNext={handleNext}
                  />
                ) : (
                  <AnswerInput value={input} onChange={setInput} onSubmit={handleSubmit} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewPanelProps {
  userInput: string;
  correctAnswer: string;
  isCorrect: boolean;
  onNext: () => void;
}

function ReviewPanel({ userInput, correctAnswer, isCorrect, onNext }: ReviewPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`flex items-center gap-2 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
        <span className="text-base">{isCorrect ? '✅' : '❌'}</span>
        <span className="text-sm font-medium">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1.5">Your answer</p>
        <p className={`text-sm font-mono px-3 py-2 rounded-lg border ${
          isCorrect
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700 line-through'
        }`}>
          {userInput}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-1.5">The answer is</p>
        <p className="text-sm font-mono px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-900 font-semibold">
          {correctAnswer}
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full mt-auto bg-blue-google text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-google-hover transition-colors duration-150 cursor-pointer"
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
