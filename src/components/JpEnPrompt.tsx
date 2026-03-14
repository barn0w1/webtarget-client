import type { Word } from '../types';

interface Props {
  word: Word;
}

export default function JpEnPrompt({ word }: Props) {
  return (
    <div className="p-8 flex flex-col gap-4 h-full">
      <span className="inline-block bg-blue-google-light text-blue-google text-xs font-medium px-2.5 py-0.5 rounded-full self-start">
        {word.part_of_speech}
      </span>
      <p className="text-2xl font-normal text-gray-900 leading-snug">{word.japanese_meaning}</p>
    </div>
  );
}
