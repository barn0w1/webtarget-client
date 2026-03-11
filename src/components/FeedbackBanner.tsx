type FeedbackState = 'correct' | 'incorrect' | null;

interface Props {
  state: FeedbackState;
  correctAnswer?: string;
}

export default function FeedbackBanner({ state, correctAnswer }: Props) {
  if (state === null) return null;

  if (state === 'correct') {
    return (
      <div className="flex items-center gap-2 px-1">
        <span className="text-green-600 text-lg leading-none">✓</span>
        <span className="text-green-700 text-sm font-medium">Correct!</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 px-1">
      <span className="text-red-500 text-lg leading-none mt-px">✗</span>
      <div>
        <p className="text-red-600 text-sm font-medium">Incorrect</p>
        <p className="text-gray-600 text-sm mt-0.5">
          Answer: <span className="font-semibold text-gray-900">{correctAnswer}</span>
        </p>
      </div>
    </div>
  );
}
