interface Props {
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  error: string | null;
}

export default function RangeInput({ start, end, onChange, error }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Word ID Range</label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Start</label>
          <input
            type="number"
            min={1}
            max={1900}
            value={start}
            onChange={e => onChange(Number(e.target.value), end)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent placeholder:text-gray-400 transition-shadow duration-150"
          />
        </div>
        <span className="text-gray-400 mt-5">–</span>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">End</label>
          <input
            type="number"
            min={1}
            max={1900}
            value={end}
            onChange={e => onChange(start, Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-google focus:border-transparent placeholder:text-gray-400 transition-shadow duration-150"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
