import type { ButtonHTMLAttributes, ReactNode } from "react";
import cn from "classnames";
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
  const classes = cn(
    className,
    unstyled
      ? "ui-button--unstyled"
      : [
          "ui-button",
          `ui-button--${variant}`,
          size !== "default" && `ui-button--${size}`,
          block && "ui-button--block",
        ]
  );

  return (
    <button className={classes} {...rest}>
      {icon ? <span className="ui-button__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export type { ButtonProps };
