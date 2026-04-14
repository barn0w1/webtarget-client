interface Props {
  message: string;
}

export default function ErrorScreen({ message }: Props) {
  return (
    <div className="status-screen">
      <p className="status-brand">webtarget.dev</p>
      <div className="error-card">
        <p className="error-title">Failed to load vocabulary</p>
        <p className="error-copy">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="button-primary error-button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
