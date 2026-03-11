import type { PracticeMode } from '../types';

interface Props {
  value: PracticeMode;
  onChange: (mode: PracticeMode) => void;
}

const options: { mode: PracticeMode; label: string; description: string }[] = [
  { mode: 'jp-en', label: 'JP → EN', description: 'See Japanese meaning, type the English word' },
  { mode: 'en-en', label: 'EN → EN', description: 'See English sentence with a blank, fill in the word' },
];

export default function ModeSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Practice Mode</label>
      <div className="flex flex-col gap-3">
        {options.map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            className={`text-left border rounded-xl px-4 py-3 transition-all duration-150 cursor-pointer ${
              value === opt.mode
                ? 'border-blue-google bg-blue-google-light'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className={`font-medium text-sm ${value === opt.mode ? 'text-blue-google' : 'text-gray-900'}`}>
              {opt.label}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
