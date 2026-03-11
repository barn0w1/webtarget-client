import type { Word } from '../types';

interface Props {
  word: Word;
}

export default function JpEnPrompt({ word }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <span className="inline-block bg-blue-google-light text-blue-google text-xs font-medium px-2.5 py-0.5 rounded-full mb-4">
        {word.part_of_speech}
      </span>
      <p className="text-2xl font-medium text-gray-900 mb-3 leading-snug">{word.japanese_meaning}</p>
      <p className="font-mono text-sm text-gray-400">{word.pronunciation}</p>
    </div>
  );
}
