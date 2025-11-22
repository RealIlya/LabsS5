import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "default" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "default",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ["ui-button", `ui-button--${variant}`, `ui-button--${size}`];
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
