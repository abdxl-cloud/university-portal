/* Shared UI primitives (React) — map onto tokens.css classes */

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

function IconBtn({ name, size = 18, ...rest }) {
  return (
    <button className="fb-icon-btn" {...rest}>
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

function Field({ label, hint, children }) {
  return (
    <label className="u-stack" style={{ gap: 6 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>}
      {children}
      {hint && <span className="u-meta">{hint}</span>}
    </label>
  );
}

function Stat({ icon, k, v, sub, accent }) {
  return (
    <div className="u-stat">
      <div className="u-stat__k">
        {icon && <span className={"u-icon" + (accent ? "" : " u-icon--plain")} style={{ width: 26, height: 26 }}><Icon name={icon} size={14} /></span>}
        {k}
      </div>
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

function Modal({ children, onClose, lg }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="u-modal-bg" onClick={onClose}>
      <div className={"u-modal" + (lg ? " u-modal--lg" : "")} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
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

Object.assign(window, {
  Btn, IconBtn, Tag, Card, Switch, Avatar, Field, Stat, Seg, Modal, ModalHead, Steps, Empty,
});
