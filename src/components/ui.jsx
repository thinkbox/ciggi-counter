// Small building blocks. The HTML-like tags in these files are JSX:
// they look like HTML, and React turns them into elements on the page.
// `className` is the JSX name for an HTML `class`.

import { useEffect, useRef } from "react";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const buttonVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border bg-transparent",
  ghost: "bg-transparent",
};

const buttonSizes = {
  default: "h-10 px-4",
  sm: "h-8 px-3 text-sm",
  lg: "h-20 px-2 text-lg",
  icon: "h-9 w-9",
};

export function Button({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-card-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Dialog({ open, onOpenChange, title, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="w-full max-w-md rounded-xl border border-card-border bg-card p-6 text-card-foreground shadow-lg"
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === ref.current) onOpenChange(false);
      }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </dialog>
  );
}

export function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
