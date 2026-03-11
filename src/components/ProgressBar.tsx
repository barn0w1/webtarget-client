interface Props {
  completedCount: number;
  totalCount: number;
}

export default function ProgressBar({ completedCount, totalCount }: Props) {
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  return (
    <div className="h-1 bg-gray-100 w-full overflow-hidden">
      <div
        className="h-full bg-blue-google transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
