import type { Word } from '../types';

interface Props {
  word: Word;
}

export default function JpEnPrompt({ word }: Props) {
  return (
    <div className="word-prompt">
      <span className="word-pos-badge">
        {word.part_of_speech}
      </span>
      <p className="word-japanese-text">{word.japanese_meaning}</p>
    </div>
  );
}
