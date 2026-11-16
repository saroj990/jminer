import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type FieldProps = {
  label: string;
  hint?: string;
};

export function TextField({
  label,
  hint,
  className = "",
  spellCheck,
  type = "text",
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const enableSpellCheck =
    spellCheck ??
    (type === "text" || type === "search" || type === "url" || type === "tel");

  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </span>
      <input
        type={type}
        spellCheck={enableSpellCheck}
        autoCorrect={enableSpellCheck ? "on" : "off"}
        className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm text-[var(--ink)] shadow-[var(--input-inset)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:bg-[var(--panel-muted)] disabled:opacity-60"
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--ink-muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  className = "",
  spellCheck = true,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </span>
      <textarea
        spellCheck={spellCheck}
        autoCorrect="on"
        className="min-h-24 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] shadow-[var(--input-inset)] outline-none transition placeholder:text-[var(--ink-muted)]/70 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--ink-muted)]">{hint}</span> : null}
    </label>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="animate-fade-up rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-[1.35rem] font-semibold tracking-tight text-[var(--ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function EntryCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[var(--panel-muted)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--ink-soft)]">{title}</h3>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md px-2 py-1 text-xs font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function AddButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--panel)]"
    >
      {label}
    </button>
  );
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_8px_20px_-10px_rgba(31,122,108,0.7)]"
      : variant === "ghost"
        ? "text-[var(--ink-muted)] hover:bg-[var(--panel)]/70 hover:text-[var(--ink)]"
        : "border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]";

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${styles} ${className}`}
      type="button"
      {...props}
    />
  );
}
