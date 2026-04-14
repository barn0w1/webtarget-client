interface Props {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: Props) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}
