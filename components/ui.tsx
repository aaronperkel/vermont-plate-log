import type { ReactNode } from 'react';

/*
 * The whole primitive set. Hairline rules rather than cards: nothing in this
 * app casts a shadow and nothing but the plate has a meaningful corner radius,
 * which is what keeps the plate reading as an object instead of one more
 * rounded box among many.
 */

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-4">
      {(title || actions) && (
        <div className="mb-3 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {description && <p className="mb-4 max-w-prose text-sm text-ink-soft">{description}</p>}
      {children}
    </section>
  );
}

/*
 * A form field. The label sits inside the box at the top left, the way it does
 * on a paper form — not as a tracked-out caps eyebrow floating above it.
 */
export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-rule bg-surface px-3 py-2 focus-within:border-rule-strong">
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-rule px-5 py-10 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      <div className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** A labelled figure. Numbers use tabular figures so columns line up. */
export function Figure({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-ink-soft">{label}</div>
      <div className="tnum mt-0.5 text-2xl font-semibold text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}
