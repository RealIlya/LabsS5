import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "icon" | "compact";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  block?: boolean;
  unstyled?: boolean;
}

export function Button({
  variant = "primary",
  size = "default",
  icon,
  className,
  children,
  block = false,
  unstyled = false,
  ...rest
}: ButtonProps) {
  const classes: string[] = [];

  if (unstyled) {
    classes.push("ui-button--unstyled");
  } else {
    classes.push("ui-button", `ui-button--${variant}`);
    if (size !== "default") {
      classes.push(`ui-button--${size}`);
    }
    if (block) {
      classes.push("ui-button--block");
    }
  }

  if (className) {
    classes.push(className);
  }

  return (
    <button className={classes.join(" ")} {...rest}>
      {icon ? <span className="ui-button__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export type { ButtonProps };
