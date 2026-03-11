export type PracticeMode = 'jp-en' | 'en-en';

export interface Word {
  id: number;
  word: string;
  part_of_speech: string;
  pronunciation: string;
  japanese_meaning: string;
  example_sentence: string;
}

export interface SessionConfig {
  start: number;
  end: number;
  mode: PracticeMode;
}

export interface CompletedResult {
  word: Word;
  incorrectCount: number;
}

export interface SessionResult {
  config: SessionConfig;
  completedWords: CompletedResult[];
  startTime: number;
  endTime: number;
}
