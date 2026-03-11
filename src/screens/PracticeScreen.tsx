import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { Word, SessionConfig } from '../types';
import { useSession } from '../hooks/useSession';
import ProgressBar from '../components/ProgressBar';
import WordPrompt from '../components/WordPrompt';
import AnswerInput from '../components/AnswerInput';
import FeedbackBanner from '../components/FeedbackBanner';

interface Props {
  words: Word[];
}

type FeedbackState = 'correct' | 'incorrect' | null;

export default function PracticeScreen({ words }: Props) {
  const { state } = useLocation();
  const config = state?.config as SessionConfig | undefined;
  if (!config) return <Navigate to="/" replace />;
  return <PracticeSession words={words} config={config} />;
}

function PracticeSession({ words, config }: { words: Word[]; config: SessionConfig }) {
  const navigate = useNavigate();
  const { currentWord, queueLength, completedCount, totalCount, submitAnswer, result } =
    useSession(words, config);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [visible, setVisible] = useState(true);
  const startTimeRef = useRef(Date.now());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedRef = useRef(false);

  useEffect(() => {
    if (result) navigate('/results', { state: { result }, replace: true });
  }, [result, navigate]);

  function clearPendingAdvance() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function advance() {
    clearPendingAdvance();
    blockedRef.current = false;
    setFeedback(null);
    setInput('');
    setVisible(true);
  }

  function handleSubmitOrAdvance() {
    if (blockedRef.current) {
      advance();
      return;
    }
    if (!currentWord || input.trim() === '') return;

    blockedRef.current = true;
    setVisible(false);

    const outcome = submitAnswer(input);
    if (outcome === 'complete') return;

    setFeedback(outcome);
    advanceTimerRef.current = setTimeout(advance, outcome === 'correct' ? 800 : 1500);
  }

  function handleInputChange(value: string) {
    if (blockedRef.current) {
      advance();
    } else {
      setInput(value);
    }
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
          <div
            className={`w-full max-w-4xl border border-gray-200 rounded-2xl overflow-hidden transition-opacity duration-200 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex min-h-[300px]">
              {/* Left: question (white) */}
              <div className="flex-1 border-r border-gray-200 bg-white">
                <WordPrompt word={currentWord} mode={config.mode} />
              </div>

              {/* Right: answer area (gray) */}
              <div className="w-80 flex-shrink-0 bg-surface-gray p-6 flex flex-col gap-4">
                <AnswerInput
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmitOrAdvance}
                />
                <FeedbackBanner state={feedback} correctAnswer={currentWord.word} />
              </div>
            </div>
          </div>
        )}
      </div>
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
