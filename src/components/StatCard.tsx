interface Props {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm flex-1">
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
