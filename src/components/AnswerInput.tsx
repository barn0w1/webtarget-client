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

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type the English word…"
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent placeholder:text-gray-400 transition-shadow duration-150"
      />
      <button
        type="button"
        disabled={value.trim() === ''}
        onClick={onSubmit}
        className="w-full bg-blue-google text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-google-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Submit
      </button>
    </div>
  );
}
