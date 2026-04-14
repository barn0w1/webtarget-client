import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function AnswerInput({ value, onChange, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSubmit();
  }

  const canSubmit = value.trim() !== '';

  return (
    <div className="answer-form" role="group" aria-label="Answer input">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type the English word…"
        className="answer-text-input"
      />
      {canSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="answer-inline-button"
        >
          Submit →
        </button>
      )}
    </div>
  );
}
