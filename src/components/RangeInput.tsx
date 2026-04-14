interface Props {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  error: string | null;
}

export default function RangeInput({ start, end, onChange, error }: Props) {
  return (
    <div>
      <p className="section-label">Word ID Range</p>
      <div className="range-grid">
        <div className="range-field">
          <label className="range-field-label" htmlFor="range-component-start">Start</label>
          <input
            id="range-component-start"
            type="number"
            min={1}
            max={1900}
            value={start}
            onChange={e => onChange(Number(e.target.value), end)}
            className="range-input"
          />
        </div>
        <span className="range-separator" aria-hidden="true">—</span>
        <div className="range-field">
          <label className="range-field-label" htmlFor="range-component-end">End</label>
          <input
            id="range-component-end"
            type="number"
            min={1}
            max={1900}
            value={end}
            onChange={e => onChange(start, Number(e.target.value))}
            className="range-input"
          />
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
