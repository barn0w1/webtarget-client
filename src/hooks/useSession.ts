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
  submitAnswer: (input: string) => 'correct' | 'incorrect' | 'complete';
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

  const submitAnswer = useCallback((input: string): 'correct' | 'incorrect' | 'complete' => {
    if (queue.length === 0 || result !== null) return 'correct';

    const currentWord = queue[0];
    const normalizedInput = input.trim().toLowerCase();
    const normalizedTarget = currentWord.word.trim().toLowerCase();

    if (normalizedInput === normalizedTarget) {
      const newCompletedIds = new Set(completedIds);
      newCompletedIds.add(currentWord.id);
      const newQueue = queue.slice(1);

      if (newCompletedIds.size === state.allWords.length) {
        setQueue(newQueue);
        setCompletedIds(newCompletedIds);
        const finalResult = buildResult({
          ...state,
          queue: newQueue,
          incorrectCounts,
          completedIds: newCompletedIds,
        });
        setResult(finalResult);
        return 'complete';
      }

      setQueue(newQueue);
      setCompletedIds(newCompletedIds);
      return 'correct';
    } else {
      const newIncorrectCounts = new Map(incorrectCounts);
      newIncorrectCounts.set(currentWord.id, (newIncorrectCounts.get(currentWord.id) ?? 0) + 1);

      const remaining = queue.slice(1);
      let insertIndex: number;
      if (remaining.length === 0) {
        insertIndex = 0;
      } else {
        insertIndex = Math.floor(Math.random() * remaining.length) + 1;
      }
      const newQueue = [...remaining.slice(0, insertIndex), currentWord, ...remaining.slice(insertIndex)];

      setQueue(newQueue);
      setIncorrectCounts(newIncorrectCounts);
      return 'incorrect';
    }
  }, [queue, completedIds, incorrectCounts, result, state]);

  return {
    currentWord: queue.length > 0 ? queue[0] : null,
    queueLength: queue.length,
    completedCount: completedIds.size,
    totalCount: state.allWords.length,
    submitAnswer,
    result,
  };
}
