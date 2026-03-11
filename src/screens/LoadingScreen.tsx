export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <p className="text-xs text-gray-400 mb-8 tracking-wide">webtarget.dev</p>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-google rounded-full animate-spin" />
    </div>
  );
}
