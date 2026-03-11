interface Props {
  message: string;
}

export default function ErrorScreen({ message }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <p className="text-xs text-gray-400 mb-8 tracking-wide">webtarget.dev</p>
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full text-center shadow-sm">
        <p className="text-gray-900 font-medium mb-2">Failed to load vocabulary</p>
        <p className="text-gray-500 text-sm mb-6 font-mono">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-google text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-google-hover transition-colors duration-150 cursor-pointer"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
