type FeedbackState = 'correct' | 'incorrect' | null;

interface Props {
  state: FeedbackState;
  correctAnswer?: string;
}

export default function FeedbackBanner({ state, correctAnswer }: Props) {
  if (state === null) return <div className="h-10" />;

  if (state === 'correct') {
    return (
      <div className="h-10 flex items-center justify-center rounded-lg bg-green-50 border border-green-200">
        <span className="text-green-700 text-sm font-medium">Correct!</span>
      </div>
    );
  }

  return (
    <div className="h-10 flex items-center justify-center rounded-lg bg-red-50 border border-red-200">
      <span className="text-red-700 text-sm font-medium">
        The answer was: <span className="font-bold">{correctAnswer}</span>
      </span>
    </div>
  );
}
