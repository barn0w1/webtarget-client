import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import type { Word, SessionConfig } from '../types';
import { useSession } from '../hooks/useSession';
import ProgressBar from '../components/ProgressBar';
import SessionStats from '../components/SessionStats';
import WordPrompt from '../components/WordPrompt';
import AnswerInput from '../components/AnswerInput';
import FeedbackBanner from '../components/FeedbackBanner';

interface Props {
  words: Word[];
}

type FeedbackState = 'correct' | 'incorrect' | null;

export default function PracticeScreen({ words }: Props) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const config = state?.config as SessionConfig | undefined;

  if (!config) return <Navigate to="/" replace />;

  return <PracticeSession words={words} config={config} />;
}

function PracticeSession({ words, config }: { words: Word[]; config: SessionConfig }) {
  const navigate = useNavigate();
  const {
    currentWord,
    queueLength,
    completedCount,
    totalCount,
    submitAnswer,
    result,
  } = useSession(words, config);

  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [visible, setVisible] = useState(true);
  const startTimeRef = useRef(Date.now());
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputBlockedRef = useRef(false);

  useEffect(() => {
    if (result) {
      navigate('/results', { state: { result }, replace: true });
    }
  }, [result, navigate]);

  function advance() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    inputBlockedRef.current = false;
    setFeedback(null);
    setInput('');
    setVisible(true);
  }

  function handleSubmit() {
    if (inputBlockedRef.current || !currentWord || input.trim() === '') return;
    inputBlockedRef.current = true;

    setVisible(false);

    const outcome = submitAnswer(input);

    if (outcome === 'complete') return;

    const delay = outcome === 'correct' ? 800 : 1500;
    setFeedback(outcome);

    advanceTimerRef.current = setTimeout(() => {
      advance();
    }, delay);
  }

  // Allow pressing Enter again to advance early
  function handleInputChange(value: string) {
    if (inputBlockedRef.current) {
      // Early advance on any input activity while blocked
      if (advanceTimerRef.current) {
        advance();
      }
      return;
    }
    setInput(value);
  }

  function handleSubmitOrAdvance() {
    if (inputBlockedRef.current) {
      advance();
      return;
    }
    handleSubmit();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ProgressBar completedCount={completedCount} totalCount={totalCount} />
      <div className="flex flex-col items-center flex-1 px-4 py-6">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-400 tracking-wide">webtarget.dev</p>
            <SessionStats
              startTime={startTimeRef.current}
              completedCount={completedCount}
              totalCount={totalCount}
            />
          </div>
          {currentWord && (
            <div
              className={`transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-3">
                  {queueLength} word{queueLength !== 1 ? 's' : ''} remaining in queue
                </p>
                <WordPrompt word={currentWord} mode={config.mode} />
              </div>
              <div className="flex flex-col gap-3">
                <FeedbackBanner
                  state={feedback}
                  correctAnswer={currentWord.word}
                />
                <AnswerInput
                  value={input}
                  onChange={handleInputChange}
                  onSubmit={handleSubmitOrAdvance}
                  disabled={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
