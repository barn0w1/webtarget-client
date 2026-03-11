import { useState, useCallback } from 'react';
import type { Word, SessionConfig, SessionResult } from '../types';
import { getWordsInRange, shuffleArray } from '../utils/words';

interface SessionState {
  config: SessionConfig;
  allWords: Word[];
  queue: Word[];
  incorrectCounts: Map<number, number>;
  completedIds: Set<number>;
  startTime: number;
}

function buildResult(state: SessionState): SessionResult {
  return {
    config: state.config,
    completedWords: state.allWords.map(w => ({
      word: w,
      incorrectCount: state.incorrectCounts.get(w.id) ?? 0,
    })),
    startTime: state.startTime,
    endTime: Date.now(),
  };
}

export function useSession(words: Word[], config: SessionConfig): {
  currentWord: Word | null;
  queueLength: number;
  completedCount: number;
  totalCount: number;
  evaluateAnswer: (input: string) => 'correct' | 'incorrect';
  advance: (isCorrect: boolean) => void;
  result: SessionResult | null;
} {
  const [state] = useState<SessionState>(() => {
    const allWords = getWordsInRange(words, config.start, config.end);
    return {
      config,
      allWords,
      queue: shuffleArray(allWords),
      incorrectCounts: new Map(),
      completedIds: new Set(),
      startTime: Date.now(),
    };
  });

  const [queue, setQueue] = useState<Word[]>(state.queue);
  const [incorrectCounts, setIncorrectCounts] = useState<Map<number, number>>(state.incorrectCounts);
  const [completedIds, setCompletedIds] = useState<Set<number>>(state.completedIds);
  const [result, setResult] = useState<SessionResult | null>(null);

  const evaluateAnswer = useCallback((input: string): 'correct' | 'incorrect' => {
    if (queue.length === 0) return 'incorrect';
    return input.trim().toLowerCase() === queue[0].word.trim().toLowerCase()
      ? 'correct'
      : 'incorrect';
  }, [queue]);

  const advance = useCallback((isCorrect: boolean): void => {
    if (queue.length === 0 || result !== null) return;
    const current = queue[0];

    if (isCorrect) {
      const newCompletedIds = new Set(completedIds);
      newCompletedIds.add(current.id);
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      setCompletedIds(newCompletedIds);
      if (newCompletedIds.size === state.allWords.length) {
        setResult(buildResult({ ...state, queue: newQueue, incorrectCounts, completedIds: newCompletedIds }));
      }
    } else {
      const newIncorrectCounts = new Map(incorrectCounts);
      newIncorrectCounts.set(current.id, (newIncorrectCounts.get(current.id) ?? 0) + 1);
      const remaining = queue.slice(1);
      const insertIndex = remaining.length === 0
        ? 0
        : Math.floor(Math.random() * remaining.length) + 1;
      const newQueue = [...remaining.slice(0, insertIndex), current, ...remaining.slice(insertIndex)];
      setQueue(newQueue);
      setIncorrectCounts(newIncorrectCounts);
    }
  }, [queue, completedIds, incorrectCounts, result, state]);

  return {
    currentWord: queue.length > 0 ? queue[0] : null,
    queueLength: queue.length,
    completedCount: completedIds.size,
    totalCount: state.allWords.length,
    evaluateAnswer,
    advance,
    result,
  };
}
