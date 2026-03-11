import type { Word, PracticeMode } from '../types';
import JpEnPrompt from './JpEnPrompt';
import EnEnPrompt from './EnEnPrompt';

interface Props {
  word: Word;
  mode: PracticeMode;
}

export default function WordPrompt({ word, mode }: Props) {
  if (mode === 'jp-en') return <JpEnPrompt word={word} />;
  return <EnEnPrompt word={word} />;
}
