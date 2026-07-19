/* Shared UI primitives (React): map onto tokens.css classes */
import React from "react";
import { Icon } from "./icons";
import type { BtnSize, BtnVariant, IconName, TagVariant } from "../types";

type ButtonRest = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">;

export interface BtnProps extends ButtonRest {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
}

export function Btn({ variant = "secondary", size, icon, iconRight, children, className = "", ...rest }: BtnProps) {
  const cls = ["fb-btn", "fb-btn--" + variant];
  if (size) cls.push("fb-btn--" + size);
  if (className) cls.push(className);
  return (
    <button className={cls.join(" ")} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 13 : 15} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 13 : 15} />}
    </button>
  );
}

export interface IconBtnProps extends ButtonRest {
  name: IconName;
  size?: number;
}

export function IconBtn({ name, size = 18, className = "", ...rest }: IconBtnProps) {
  return (
    <button className={"fb-icon-btn" + (className ? " " + className : "")} {...rest}>
      <Icon name={name} size={size} />
    </button>
  );
}

export interface TagProps {
  variant?: TagVariant;
  children?: React.ReactNode;
  dot?: boolean;
}

export function Tag({ variant, children, dot }: TagProps) {
  return (
    <span className={"fb-tag" + (variant ? " fb-tag--" + variant : "")}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  pad?: boolean;
}

export function Card({ children, className = "", pad, ...rest }: CardProps) {
  return (
    <div className={"fb-card" + (pad ? " u-pad" : "") + (className ? " " + className : "")} {...rest}>
      {children}
    </div>
  );
}

export interface SwitchProps {
  on?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Switch({ on, onClick }: SwitchProps) {
  return <div className="fb-switch" data-on={!!on} onClick={onClick} role="switch" aria-checked={!!on} />;
}

export interface AvatarProps {
  initials?: string;
  size?: number;
}

export function Avatar({ initials, size = 32 }: AvatarProps) {
  return (
    <span className="fb-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  );
}

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children?: React.ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="u-stack" style={{ gap: 6 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
      {children}
      {error ? <span className="u-meta" style={{ color: "var(--danger)" }}>{error}</span> : hint && <span className="u-meta">{hint}</span>}
    </label>
  );
}

export interface StatProps {
  icon?: IconName;
  k?: React.ReactNode;
  v?: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}

export function Stat({ k, v, sub }: StatProps) {
  return (
    <div className="u-stat">
      <div className="u-stat__k">{k}</div>
      <div className="u-stat__v u-num">{v}</div>
      {sub && <div className="u-stat__sub">{sub}</div>}
    </div>
  );
}

export interface SegOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}

export interface SegProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegOption<T>[];
}

export function Seg<T extends string = string>({ value, onChange, options }: SegProps<T>) {
  return (
    <div className="u-seg">
      {options.map((o) => (
        <button key={o.value} data-on={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function focusableIn(node: HTMLElement | null): HTMLElement[] {
  if (!node) return [];
  const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(node.querySelectorAll<HTMLElement>(sel))
    .filter((el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
}

export interface ModalProps {
  children?: React.ReactNode;
  onClose?: () => void;
  lg?: boolean;
}

export function Modal({ children, onClose, lg }: ModalProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const prevFocus = React.useRef<HTMLElement | null>(null);

  // trap focus inside the dialog while open, and hand it back to whatever
  // opened the modal on close (icon-only trigger buttons otherwise lose focus)
  React.useEffect(() => {
    prevFocus.current = document.activeElement as HTMLElement | null;
    const first = focusableIn(ref.current)[0];
    (first || ref.current)?.focus();
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusableIn(ref.current);
      if (f.length === 0) { e.preventDefault(); return; }
      const firstEl = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); firstEl.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      prevFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="u-modal-bg" onClick={onClose}>
      <div ref={ref} className={"u-modal" + (lg ? " u-modal--lg" : "")} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

export interface ModalHeadProps {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  onClose?: () => void;
}

export function ModalHead({ title, sub, onClose }: ModalHeadProps) {
  return (
    <div className="u-row" style={{ justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div className="u-h2">{title}</div>
        {sub && <div className="u-meta" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <IconBtn name="x" onClick={onClose} />
    </div>
  );
}

export interface ConfirmProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  danger?: boolean;
  onConfirm: () => void;
  onClose?: () => void;
}

/* "Are you sure?" popup for destructive/high-stakes actions: shown before
   the action fires, not as after-the-fact feedback */
export function Confirm({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true, onConfirm, onClose }: ConfirmProps) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Modal onClose={onClose}>
      <ModalHead title={title} onClose={onClose} />
      <div style={{ padding: "18px 22px" }}>
        {typeof body === "string" ? <div className="u-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{body}</div> : body}
      </div>
      <div className="u-row" style={{ gap: 8, justifyContent: "flex-end", padding: "14px 22px", borderTop: "1px solid var(--border)" }}>
        <Btn variant="secondary" onClick={onClose}>{cancelLabel}</Btn>
        <Btn variant={danger ? "danger" : "accent"} disabled={busy} onClick={() => { setBusy(true); onConfirm(); }}>{confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

export interface ConfirmButtonProps extends Omit<BtnProps, "onClick" | "title"> {
  title?: React.ReactNode;
  body?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  danger?: boolean;
  onConfirm: () => void;
}

/* drop-in replacement for a plain destructive <Btn>: shows a Confirm popup
   before calling onConfirm, instead of firing immediately on click */
export function ConfirmButton({ children, variant = "ghost", size, icon, title, body, confirmLabel, cancelLabel, danger = true, onConfirm, ...rest }: ConfirmButtonProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Btn variant={variant} size={size} icon={icon} onClick={() => setOpen(true)} {...rest}>{children}</Btn>
      {open && (
        <Confirm
          title={title || children}
          body={body}
          confirmLabel={confirmLabel || children}
          cancelLabel={cancelLabel}
          danger={danger}
          onConfirm={() => { setOpen(false); onConfirm(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/** Status → [tone, label] for the shared status pill. */
const SPILL_MAP: Record<string, [TagVariant | undefined, string]> = {
  pending: ["warning", "Pending"], approved: ["success", "Approved"], rejected: ["danger", "Rejected"],
  query: ["warning", "Queried"], confirmed: ["success", "Confirmed"], flagged: ["danger", "Flagged"],
  allocated: ["success", "Allocated"], admitted: ["success", "Admitted"], published: ["success", "Published"],
  ready: ["accent", "Ready"], processing: ["accent", "Processing"], done: ["success", "Done"],
  active: ["success", "Active"], suspended: ["danger", "Suspended"], "not-submitted": [undefined, "Not submitted"],
};

/** Status pill mapping a known status string to a tone + label. Unknown statuses render as-is. */
export function SPill({ s }: { s: string }) {
  const [tone, label] = SPILL_MAP[s] || [undefined, s];
  return <Tag variant={tone} dot={!!tone}>{label}</Tag>;
}

export interface PageHeadProps {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  /** Actions rendered on the right of the heading. */
  children?: React.ReactNode;
}

/** The title block every portal screen opens with. */
export function PageHead({ title, sub, children }: PageHeadProps) {
  return (
    <div className="u-page-head">
      <div>
        <div className="u-h1">{title}</div>
        {sub && <div className="u-muted" style={{ marginTop: 6, fontSize: 14 }}>{sub}</div>}
      </div>
      {children && <div className="u-row u-wrap" style={{ gap: 8 }}>{children}</div>}
    </div>
  );
}

export interface StepsProps {
  current: number;
  labels: string[];
}

export function Steps({ current, labels }: StepsProps) {
  return (
    <div className="u-steps u-wrap">
      {labels.map((l, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <React.Fragment key={l}>
            {i > 0 && <div className="u-step__line" />}
            <div className="u-step" data-state={state}>
              <span className="u-step__n">{state === "done" ? <Icon name="check" size={13} /> : i + 1}</span>
              <span className="fb-hide-mobile">{l}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export interface EmptyProps {
  icon: IconName;
  title?: React.ReactNode;
  sub?: React.ReactNode;
}

export function Empty({ icon, title, sub }: EmptyProps) {
  return (
    <div className="u-stack" style={{ alignItems: "center", textAlign: "center", padding: "48px 20px", gap: 10 }}>
      <span className="u-icon u-icon--plain" style={{ width: 44, height: 44 }}><Icon name={icon} size={20} /></span>
      <div className="u-h3">{title}</div>
      {sub && <div className="u-muted" style={{ fontSize: 13, maxWidth: 340 }}>{sub}</div>}
    </div>
  );
}

/* brief skeleton-loading state for data-heavy screens on mount/tab switch */
export function useSkeleton(delay = 450, deps: React.DependencyList = []): boolean {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}

export interface SkeletonBlockProps {
  w?: number | string;
  h?: number | string;
}

export function SkeletonBlock({ w = "100%", h = 13 }: SkeletonBlockProps) {
  return <span className="fb-skeleton-shimmer" style={{ display: "inline-block", width: w, height: h, borderRadius: 4, background: "var(--bg-muted)" }} />;
}

/* ---- pagination ---- */
export interface Pager<T> {
  page: number;
  setPage: (n: number) => void;
  size: number;
  setSize: (n: number) => void;
  pages: number;
  total: number;
  start: number;
  slice: T[];
}

export function usePaged<T>(items: T[], initialSize = 10): Pager<T> {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(initialSize);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  React.useEffect(() => { if (page > pages) setPage(1); }, [total, size, pages, page]);
  const start = (page - 1) * size;
  const slice = items.slice(start, start + size);
  return { page, setPage, size, setSize, pages, total, start, slice };
}

export interface PaginationProps<T> {
  pager: Pager<T>;
  sizes?: number[];
  label?: string;
  noSize?: boolean;
}

export function Pagination<T>({ pager, sizes = [10, 25, 50], label = "rows", noSize }: PaginationProps<T>) {
  const { page, setPage, size, setSize, pages, total, start, slice } = pager;
  if (total === 0) return null;
  // build compact page-number list with ellipses
  const nums: (number | "…")[] = [];
  const push = (n: number | "…") => nums.push(n);
  if (pages <= 7) { for (let i = 1; i <= pages; i++) push(i); }
  else {
    push(1);
    if (page > 3) push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i);
    if (page < pages - 2) push("…");
    push(pages);
  }
  return (
    <div className="u-pager">
      <div className="u-pager__info">{start + 1}–{start + slice.length} of {total.toLocaleString()} {label}</div>
      <div className="u-pager__btns">
        <button className="u-pager__pg u-pager__text" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        {nums.map((n, i) => n === "…"
          ? <span key={"e" + i} className="u-pager__ellip">…</span>
          : <button key={n} className="u-pager__pg" data-on={n === page} onClick={() => setPage(n)}>{n}</button>)}
        <button className="u-pager__pg u-pager__text" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
      {!noSize && (
        <label className="u-pager__size">Show
          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
