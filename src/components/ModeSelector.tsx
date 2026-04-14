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
  const selected = options.find(opt => opt.mode === value);

  return (
    <div className="mode-selector">
      <p className="section-label">Practice Mode</p>
      <div className="mode-selector-pills" role="tablist" aria-label="Practice mode options">
        {options.map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            className={`mode-pill ${value === opt.mode ? 'mode-pill-active' : ''}`}
            role="tab"
            aria-selected={value === opt.mode}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {selected && <p className="mode-selector-description">{selected.description}</p>}
    </div>
  );
}
