export interface ParsedSentence {
  before: string;
  blankedToken: string;
  after: string;
  found: boolean;
}

export function parseSentence(sentence: string, word: string): ParsedSentence {
  const tokens = sentence.split(/(\b\w+\b)/);
  const targetLower = word.toLowerCase();

  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!/^\w+$/.test(token)) continue;

    const tokenLower = token.toLowerCase();

    if (tokenLower === targetLower) {
      bestIndex = i;
      bestScore = 1;
      break;
    }

    const shorter = tokenLower.length <= targetLower.length ? tokenLower : targetLower;
    const longer  = tokenLower.length <= targetLower.length ? targetLower : tokenLower;

    if (longer.startsWith(shorter)) {
      const score = shorter.length / longer.length;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }

  if (bestIndex === -1 || bestScore < 0.5) {
    return { before: sentence, blankedToken: word, after: '', found: false };
  }

  const blankedToken = tokens[bestIndex];
  const before = tokens.slice(0, bestIndex).join('');
  const after  = tokens.slice(bestIndex + 1).join('');

  return { before, blankedToken, after, found: true };
}
