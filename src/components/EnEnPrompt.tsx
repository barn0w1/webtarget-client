import type { Word } from '../types';
import { parseSentence } from '../utils/sentence';

interface Props {
  word: Word;
}

export default function EnEnPrompt({ word }: Props) {
  const { before, blankedToken, after, found } = parseSentence(word.example_sentence, word.word);
  const blankWidth = `${Math.min(Math.max(blankedToken.length, 4), 12)}ch`;

  return (
    <div className="word-prompt">
      <span className="word-pos-badge">
        {word.part_of_speech}
      </span>
      {found ? (
        <p className="word-sentence-text">
          {before}
          <span
            className="word-blank"
            style={{ width: blankWidth }}
            aria-label="blank"
          />
          {after}
        </p>
      ) : (
        <>
          <p className="word-note">The word appears in a different form.</p>
          <p className="word-sentence-text">{word.example_sentence}</p>
        </>
      )}
      <p className="word-pronunciation">[{word.pronunciation}]</p>
    </div>
  );
}
