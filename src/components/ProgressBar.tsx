interface Props {
  completedCount: number;
  totalCount: number;
}

export default function ProgressBar({ completedCount, totalCount }: Props) {
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  return (
    <div className="progress-bar">
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
