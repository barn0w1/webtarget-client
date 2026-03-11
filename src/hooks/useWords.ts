import { useState, useEffect } from 'react';
import type { Word } from '../types';

export interface WordsState {
  words: Word[] | null;
  loading: boolean;
  error: string | null;
}

export function useWords(): WordsState {
  const [state, setState] = useState<WordsState>({ words: null, loading: true, error: null });

  useEffect(() => {
    fetch('/words.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load words (${res.status})`);
        return res.json() as Promise<Word[]>;
      })
      .then(words => setState({ words, loading: false, error: null }))
      .catch(err => setState({ words: null, loading: false, error: String((err as Error).message) }));
  }, []);

  return state;
}
