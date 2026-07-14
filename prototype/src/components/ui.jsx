import React from "react";
const { Icon } = window;
/* Shared UI primitives (React): map onto tokens.css classes */

function Btn({ variant = "secondary", size, icon, iconRight, children, className = "", ...rest }) {
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

function IconBtn({ name, size = 18, className = "", ...rest }) {
  return (
    <button className={"fb-icon-btn" + (className ? " " + className : "")} {...rest}>
      <Icon name={name} size={size} />
    </button>
  );
}

function Tag({ variant, children, dot }) {
  return (
    <span className={"fb-tag" + (variant ? " fb-tag--" + variant : "")}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

function Card({ children, className = "", pad, ...rest }) {
  return (
    <div className={"fb-card" + (pad ? " u-pad" : "") + (className ? " " + className : "")} {...rest}>
      {children}
    </div>
  );
}

function Switch({ on, onClick }) {
  return <div className="fb-switch" data-on={!!on} onClick={onClick} role="switch" aria-checked={!!on} />;
}

function Avatar({ initials, size = 32 }) {
  return (
    <span className="fb-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="u-stack" style={{ gap: 6 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
      {children}
      {error ? <span className="u-meta" style={{ color: "var(--danger)" }}>{error}</span> : hint && <span className="u-meta">{hint}</span>}
    </label>
  );
}

function Stat({ icon, k, v, sub, accent }) {
  return (
    <div className="u-stat">
      <div className="u-stat__k">{k}</div>
      <div className="u-stat__v u-num">{v}</div>
      {sub && <div className="u-stat__sub">{sub}</div>}
    </div>
  );
}

function Seg({ value, onChange, options }) {
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

function focusableIn(node) {
  if (!node) return [];
  return Array.from(node.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.disabled && el.offsetParent !== null);
}

function Modal({ children, onClose, lg }) {
  const ref = React.useRef(null);
  const prevFocus = React.useRef(null);

  // trap focus inside the dialog while open, and hand it back to whatever
  // opened the modal on close (icon-only trigger buttons otherwise lose focus)
  React.useEffect(() => {
    prevFocus.current = document.activeElement;
    const first = focusableIn(ref.current)[0];
    (first || ref.current) && (first || ref.current).focus();
    const h = (e) => {
      if (e.key === "Escape") { onClose && onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusableIn(ref.current);
      if (f.length === 0) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      if (prevFocus.current && prevFocus.current.focus) prevFocus.current.focus();
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

/* "Are you sure?" popup for destructive/high-stakes actions: shown before
   the action fires, not as after-the-fact feedback */
function Confirm({ title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true, onConfirm, onClose }) {
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

/* drop-in replacement for a plain destructive <Btn>: shows a Confirm popup
   before calling onConfirm, instead of firing immediately on click */
function ConfirmButton({ children, variant = "ghost", size, icon, title, body, confirmLabel, cancelLabel, danger = true, onConfirm, ...rest }) {
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

function ModalHead({ title, sub, onClose }) {
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

function Steps({ current, labels }) {
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

function Empty({ icon, title, sub }) {
  return (
    <div className="u-stack" style={{ alignItems: "center", textAlign: "center", padding: "48px 20px", gap: 10 }}>
      <span className="u-icon u-icon--plain" style={{ width: 44, height: 44 }}><Icon name={icon} size={20} /></span>
      <div className="u-h3">{title}</div>
      {sub && <div className="u-muted" style={{ fontSize: 13, maxWidth: 340 }}>{sub}</div>}
    </div>
  );
}

/* brief skeleton-loading state for data-heavy screens on mount/tab switch */
function useSkeleton(delay = 450, deps = []) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return loading;
}

function SkeletonBlock({ w = "100%", h = 13 }) {
  return <span className="fb-skeleton-shimmer" style={{ display: "inline-block", width: w, height: h, borderRadius: 4, background: "var(--bg-muted)" }} />;
}

/* ---- pagination ---- */
function usePaged(items, initialSize = 10) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(initialSize);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  React.useEffect(() => { if (page > pages) setPage(1); }, [total, size, pages, page]);
  const start = (page - 1) * size;
  const slice = items.slice(start, start + size);
  return { page, setPage, size, setSize, pages, total, start, slice };
}

function Pagination({ pager, sizes = [10, 25, 50], label = "rows", noSize }) {
  const { page, setPage, size, setSize, pages, total, start, slice } = pager;
  if (total === 0) return null;
  // build compact page-number list with ellipses
  const nums = [];
  const push = (n) => nums.push(n);
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

Object.assign(window, {
  Btn, IconBtn, Tag, Card, Switch, Avatar, Field, Stat, Seg, Modal, ModalHead, Confirm, ConfirmButton, Steps, Empty,
  usePaged, Pagination, useSkeleton, SkeletonBlock,
});
