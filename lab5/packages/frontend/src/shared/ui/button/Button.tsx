import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = ["ui-button", `ui-button--${variant}`];
  if (className) {
    classes.push(className);
  }
  return (
    <button
      className={classes.join(" ")}
      {...rest}
    >
      {icon ? <span className="ui-button__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export type { ButtonProps };
