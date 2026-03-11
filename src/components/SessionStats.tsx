import { useState, useEffect } from 'react';

interface Props {
  startTime: number;
  completedCount: number;
  totalCount: number;
}

function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SessionStats({ startTime, completedCount, totalCount }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between text-sm text-gray-500 py-3">
      <span>{formatElapsed(now - startTime)}</span>
      <span>{completedCount} / {totalCount} words</span>
    </div>
  );
}
