import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function AnswerInput({ value, onChange, onSubmit, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !disabled && value.trim() !== '') {
      onSubmit();
    }
  }

  return (
    <div className="flex gap-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type the English word…"
        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent placeholder:text-gray-400 transition-shadow duration-150 disabled:opacity-50"
      />
      <button
        type="button"
        disabled={disabled || value.trim() === ''}
        onClick={onSubmit}
        className="bg-blue-google text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-google-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
      >
        Submit
      </button>
    </div>
  );
}
