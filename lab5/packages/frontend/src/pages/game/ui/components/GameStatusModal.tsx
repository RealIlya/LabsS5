import type { ReactNode } from "react";
import cn from "classnames";

interface GameStatusModalProps {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "error";
  showSpinner?: boolean;
  actions?: ReactNode;
}

export function GameStatusModal({
  title,
  description,
  variant = "default",
  showSpinner = false,
  actions,
}: GameStatusModalProps) {
  return (
    <div
      className={cn("game__status-overlay", {
        "game__status-overlay--error": variant === "error",
      })}
      role="dialog"
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-busy={showSpinner}
    >
      <div className="game__status-card">
        {showSpinner ? (
          <div className="game__status-spinner" aria-hidden="true" />
        ) : null}
        {title ? <h3>{title}</h3> : null}
        {description ? <p>{description}</p> : null}
        {actions ? <div className="game__status-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
