import type { CompletedResult } from '../types';

interface Props {
  missedWords: CompletedResult[];
}

function computeRanks(words: CompletedResult[]): number[] {
  const ranks: number[] = [];
  let rank = 1;
  for (let i = 0; i < words.length; i++) {
    if (i > 0 && words[i].incorrectCount < words[i - 1].incorrectCount) {
      rank = i + 1;
    }
    ranks.push(rank);
  }
  return ranks;
}

export default function MissedWordsTable({ missedWords }: Props) {
  if (missedWords.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg font-medium text-gray-900 mb-1">Perfect score!</p>
        <p className="text-sm">You answered every word correctly on the first try.</p>
      </div>
    );
  }

  const ranks = computeRanks(missedWords);

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        Words to review ({missedWords.length})
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-10">#</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Word</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Meaning</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Missed</th>
            </tr>
          </thead>
          <tbody>
            {missedWords.map((entry, i) => (
              <tr key={entry.word.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-400">{ranks[i]}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{entry.word.word}</td>
                <td className="px-4 py-3 text-gray-500">{entry.word.japanese_meaning}</td>
                <td className="px-4 py-3 text-right text-red-500 font-medium">{entry.incorrectCount}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
