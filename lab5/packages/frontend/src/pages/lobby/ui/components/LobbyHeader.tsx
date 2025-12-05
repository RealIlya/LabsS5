import { Button } from "../../../../shared/ui/button";

interface LobbyHeaderProps {
  title: string;
  statusLabel: string;
  statusText: string;
  codeLabel: string;
  lobbyCode: string;
  copyStatus: "idle" | "done" | "error";
  onCopyCode: () => void;
  copyTooltip: string;
}

export function LobbyHeader({
  title,
  statusLabel,
  statusText,
  codeLabel,
  lobbyCode,
  copyStatus,
  onCopyCode,
  copyTooltip,
}: LobbyHeaderProps) {
  return (
    <header className="lobby__header">
      <div className="lobby__title-group">
        <h1>{title}</h1>
        <p className="lobby__status-text">
          {statusLabel}: {statusText}
        </p>
      </div>
      <div className="lobby__code-panel">
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {codeLabel}
        </span>
        <div className="lobby__code-box">
          <strong>{lobbyCode}</strong>
          <Button
            variant="secondary"
            size="icon"
            onClick={onCopyCode}
            title={copyTooltip}
            style={{ height: 32, width: 32 }}
          >
            {copyStatus === "done" ? "✓" : "📋"}
          </Button>
        </div>
      </div>
    </header>
  );
}
