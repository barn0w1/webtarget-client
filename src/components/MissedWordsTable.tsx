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
      <div className="missed-empty">
        <p className="missed-empty-title">Perfect score!</p>
        <p className="missed-empty-copy">You answered every word correctly on the first try.</p>
      </div>
    );
  }

  const ranks = computeRanks(missedWords);

  return (
    <div>
      <h2 className="missed-title">
        Words to review ({missedWords.length})
      </h2>
      <div className="missed-table-wrap">
        <table className="missed-table">
          <thead>
            <tr>
              <th className="missed-rank">#</th>
              <th>Word</th>
              <th>Meaning</th>
              <th className="missed-count">Missed</th>
            </tr>
          </thead>
          <tbody>
            {missedWords.map((entry, i) => (
              <tr key={entry.word.id}>
                <td className="missed-rank">{ranks[i]}</td>
                <td className="missed-word">{entry.word.word}</td>
                <td>{entry.word.japanese_meaning}</td>
                <td className="missed-count">{entry.incorrectCount}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
