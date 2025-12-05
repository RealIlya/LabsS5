import { Button } from "../../../../shared/ui/button";

interface LobbyFooterProps {
  onLeave: () => void;
  onStart: () => void;
  leaveDisabled: boolean;
  startDisabled: boolean;
  leaveLabel: string;
  startLabel: string;
  highlightStart: boolean;
}

export function LobbyFooter({
  onLeave,
  onStart,
  leaveDisabled,
  startDisabled,
  leaveLabel,
  startLabel,
  highlightStart,
}: LobbyFooterProps) {
  return (
    <footer className="lobby__footer">
      <Button variant="secondary" onClick={onLeave} disabled={leaveDisabled}>
        {leaveLabel}
      </Button>

      <Button
        disabled={startDisabled}
        onClick={onStart}
        style={{
          minWidth: 200,
          padding: "1rem",
          fontSize: "1.1rem",
          background: highlightStart ? "var(--gradient-button)" : undefined,
        }}
      >
        {startLabel}
      </Button>
    </footer>
  );
}
