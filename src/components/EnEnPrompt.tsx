import type { Word } from '../types';
import { parseSentence } from '../utils/sentence';

interface Props {
  word: Word;
}

export default function EnEnPrompt({ word }: Props) {
  const { before, blankedToken, after, found } = parseSentence(word.example_sentence, word.word);
  const blankWidth = `${Math.min(Math.max(blankedToken.length, 4), 12)}ch`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <span className="inline-block bg-blue-google-light text-blue-google text-xs font-medium px-2.5 py-0.5 rounded-full mb-4">
        {word.part_of_speech}
      </span>
      {found ? (
        <p className="text-xl leading-relaxed text-gray-800">
          {before}
          <span
            className="inline-block border-b-2 border-gray-500 mx-1 align-bottom"
            style={{ width: blankWidth, marginBottom: '2px' }}
            aria-label="blank"
          />
          {after}
        </p>
      ) : (
        <>
          <p className="text-sm text-amber-600 mb-2">Fill in the blank: the answer appears in a different form.</p>
          <p className="text-xl leading-relaxed text-gray-800">{word.example_sentence}</p>
        </>
      )}
      <p className="font-mono text-sm text-gray-400 mt-3">{word.pronunciation}</p>
    </div>
  );
}
