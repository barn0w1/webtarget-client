type FeedbackState = 'correct' | 'incorrect' | null;

interface Props {
  state: FeedbackState;
  correctAnswer?: string;
}

export default function FeedbackBanner({ state, correctAnswer }: Props) {
  if (state === null) return null;

  if (state === 'correct') {
    return (
      <p className="review-status review-status-correct">
        <span className="review-status-icon" aria-hidden="true">✓</span>
        <span>Correct</span>
      </p>
    );
  }

  return (
    <div>
      <p className="review-status review-status-incorrect">
        <span className="review-status-icon" aria-hidden="true">✕</span>
        <span>Incorrect</span>
      </p>
      <p className="review-answer review-answer-incorrect">Answer: {correctAnswer}</p>
    </div>
  );
}
