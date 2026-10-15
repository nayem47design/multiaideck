import { type ReactNode, useState } from "react";

import { Icon, type IconName } from "@/components/atoms/Icon";
import { cx, focusRing, stateLayer } from "@/components/atoms/states";

// Figma: Design system › Sign-in methods card (103:21212): connected methods, and the "set a
// password" form shown expanded in Figma.

export interface SignInMethod {
  id: string;
  icon: IconName;
  title: string;
  help: string;
  status: { label: string; connected: boolean };
}

export interface PasswordStrength {
  /** 0–4 filled segments. */
  score: number;
  label: string;
  rules: { label: string; met: boolean }[];
}

export interface SetPasswordForm {
  password: {
    label: string;
    value: string;
    onValueChange: (v: string) => void;
  };
  confirm: {
    label: string;
    value: string;
    placeholder: string;
    onValueChange: (v: string) => void;
  };
  strength: PasswordStrength;
  showLabel: string;
  hideLabel: string;
  cancelLabel: string;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit?: () => void;
}

export interface SignInMethodsCardProps {
  title: string;
  methods: SignInMethod[];
  /** Shown under the method it belongs to (in Figma: email and password). */
  setPassword?: { afterMethod: string; form: SetPasswordForm };
  className?: string;
}

function PasswordInput({
  label,
  value,
  placeholder,
  onValueChange,
  showLabel,
  hideLabel,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onValueChange: (v: string) => void;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-2">
      <span className="type-field-label text-ink-2">{label}</span>
      <span
        className={cx(
          "flex h-input-height items-center gap-2 rounded-md bg-surface px-4",
          "ring-(length:--input-border-width) ring-line ring-inset",
          "focus-within:ring-(length:--input-border-focus-width) focus-within:ring-blue",
        )}
      >
        <input
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
          className={cx(
            "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-3",
            visible || !value ? "type-input" : "type-password",
          )}
        />
        <button
          type="button"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className={cx("rounded-pill text-ink-3 hover:text-ink", focusRing)}
        >
          <Icon name="view" className="size-icon-button-icon" />
        </button>
      </span>
    </label>
  );
}

function Row({
  icon,
  title,
  help,
  children,
}: {
  icon: IconName;
  title: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-line py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-data-tile bg-canvas text-ink-2">
        <Icon name={icon} className="size-icon-button-icon" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0-5">
        <span className="type-setting-row-title text-ink">{title}</span>
        <span className="type-setting-row-help text-ink-3">{help}</span>
      </span>
      {children}
    </div>
  );
}

export function SignInMethodsCard({
  title,
  methods,
  setPassword,
  className,
}: SignInMethodsCardProps) {
  return (
    <section
      className={cx(
        "flex w-full flex-col rounded-xl border border-line bg-surface px-6 pt-6 pb-4 shadow-stat-card",
        className,
      )}
    >
      <h2 className="pb-3 type-step-title text-ink">{title}</h2>
      {methods.map((m) => (
        <div key={m.id}>
          <Row icon={m.icon} title={m.title} help={m.help}>
            <span
              className={cx(
                "inline-flex shrink-0 items-center gap-1 rounded-pill px-3 py-1 type-stat-chip",
                m.status.connected
                  ? "bg-status-success-soft text-success"
                  : "bg-canvas text-ink-3",
              )}
            >
              {m.status.connected && <Icon name="tick-02" className="size-3" />}
              {m.status.label}
            </span>
          </Row>
          {setPassword?.afterMethod === m.id && (
            <SetPassword {...setPassword.form} />
          )}
        </div>
      ))}
    </section>
  );
}

function SetPassword({
  password,
  confirm,
  strength,
  showLabel,
  hideLabel,
  cancelLabel,
  submitLabel,
  onCancel,
  onSubmit,
}: SetPasswordForm) {
  return (
    <form
      className="flex flex-col gap-4 pt-1 pb-2 pl-set-password-indent"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <PasswordInput
        {...password}
        showLabel={showLabel}
        hideLabel={hideLabel}
      />
      {/* Figma's strength row (505px) does not fit its 436px column and is clipped; here the
          rules move under the bars as a group when there is no room. */}
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cx(
                "h-1 w-14 rounded-pill",
                i < strength.score ? "bg-status-warning-bar" : "bg-line",
              )}
            />
          ))}
        </span>
        <span className="type-stat-chip text-status-warning">
          {strength.label}
        </span>
        <span className="flex flex-1 justify-end gap-2 whitespace-nowrap">
          {strength.rules.map((r) => (
            <span
              key={r.label}
              className={cx(
                "inline-flex items-center gap-1 type-caption",
                r.met ? "text-ink-2" : "text-ink-3",
              )}
            >
              <Icon
                name={r.met ? "tick-02" : "cancel-01"}
                className={cx("size-select-icon", r.met && "text-success")}
              />
              {r.label}
            </span>
          ))}
        </span>
      </div>
      <PasswordInput {...confirm} showLabel={showLabel} hideLabel={hideLabel} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={cx(
            "inline-flex h-10 items-center rounded-pill px-4 type-label text-ink",
            stateLayer,
            focusRing,
          )}
        >
          {cancelLabel}
        </button>
        {/* Figma's "Set password" pill is 40px, between the Button sizes (44 / 36). */}
        <button
          type="submit"
          className={cx(
            "inline-flex h-10 items-center rounded-pill bg-cta px-5 type-nav-item-selected text-on-cta",
            stateLayer,
            focusRing,
          )}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
