import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReactNode } from "react";

import { tokens } from "./tokens.generated";

// Developer reference page, compared by eye with the Figma Tokens page (28:7489).
// Every value shown here is read from tokens.generated.ts, so it can never drift from tokens.css.

const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

const SAMPLE_EN = "Ask once. Compare every answer.";
const SAMPLE_BN = "একবার জিজ্ঞেস করুন। প্রতিটি উত্তর মিলিয়ে দেখুন।";

function ThemePanels({ children }: { children: (mode: Mode) => ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {MODES.map((mode) => (
        <section
          key={mode}
          data-theme={mode}
          className="min-w-0 bg-canvas p-6 text-ink"
        >
          <p className="mb-4 type-label text-ink-2 capitalize">{mode}</p>
          {children(mode)}
        </section>
      ))}
    </div>
  );
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-line">{children}</div>;
}

function Row({
  preview,
  name,
  detail,
}: {
  preview: ReactNode;
  name: string;
  detail?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex w-16 shrink-0 items-center">{preview}</div>
      <div className="min-w-0">
        <p className="type-ui-strong">{name}</p>
        {detail && <p className="type-mono text-ink-2">{detail}</p>}
      </div>
    </div>
  );
}

function Swatch({ cssVar }: { cssVar: string }) {
  return (
    <span
      className="block size-control-lg rounded-sm border border-line"
      style={{ backgroundColor: `var(${cssVar})` }}
    />
  );
}

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: { component: "Generated from Figma by `npm run tokens`." },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colours: Story = {
  render: () => (
    <ThemePanels>
      {(mode) => (
        <Rows>
          {tokens.colors.map((c) => (
            <Row
              key={c.name}
              preview={<Swatch cssVar={c.cssVar} />}
              name={c.name}
              detail={`${c.utility} · ${c[mode].primitive} · ${c[mode].value}`}
            />
          ))}
        </Rows>
      )}
    </ThemePanels>
  ),
};

export const Primitives: Story = {
  render: () => (
    <section className="bg-canvas p-6 text-ink">
      <p className="mb-4 type-label text-ink-2">
        Raw values. Never used directly in components.
      </p>
      <div className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
        {tokens.primitives.map((p) => (
          <Row
            key={p.name}
            preview={<Swatch cssVar={p.cssVar} />}
            name={p.name}
            detail={p.value}
          />
        ))}
      </div>
    </section>
  ),
};

export const Spacing: Story = {
  render: () => (
    <ThemePanels>
      {() => (
        <>
          <Rows>
            {tokens.space.map((s) => (
              <Row
                key={s.name}
                preview={
                  <span
                    className="block h-2 rounded-xs bg-blue"
                    style={{ width: `var(${s.cssVar})` }}
                  />
                }
                name={s.name}
                detail={`p-${s.key} · ${s.value}`}
              />
            ))}
          </Rows>
          <p className="mt-8 mb-2 type-label text-ink-2">Size</p>
          <Rows>
            {tokens.size.map((s) => (
              <Row
                key={s.name}
                preview={
                  <span
                    className="block rounded-xs border border-blue bg-blue-soft"
                    style={{
                      width: `var(${s.cssVar})`,
                      height: `var(${s.cssVar})`,
                    }}
                  />
                }
                name={s.name}
                detail={`size-${s.key} · ${s.value}`}
              />
            ))}
          </Rows>
        </>
      )}
    </ThemePanels>
  ),
};

export const Radius: Story = {
  render: () => (
    <ThemePanels>
      {() => (
        <Rows>
          {tokens.radius.map((r) => (
            <Row
              key={r.name}
              preview={
                <span
                  className="block size-16 border border-blue bg-blue-soft"
                  style={{ borderRadius: `var(${r.cssVar})` }}
                />
              }
              name={r.name}
              detail={`rounded-${r.key} · ${r.value}`}
            />
          ))}
        </Rows>
      )}
    </ThemePanels>
  ),
};

export const Shadows: Story = {
  render: () => (
    <ThemePanels>
      {() => (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-8">
            {tokens.shadows
              .filter((s) => !s.backgroundBlur)
              .map((s) => (
                <figure
                  key={s.name}
                  className="rounded-lg bg-surface p-6"
                  style={{ boxShadow: `var(${s.cssVar})` }}
                >
                  <p className="type-ui-strong">{s.name}</p>
                  <p className="type-mono text-ink-2">shadow-{s.key}</p>
                </figure>
              ))}
          </div>
          <div className="flex flex-wrap gap-8 rounded-xl bg-linear-to-br from-iris-violet via-iris-pink to-iris-cyan p-8">
            <figure className="flex flex-col rounded-lg glass p-6 shadow-glass">
              <p className="type-ui-strong">Glass/Default</p>
              <p className="type-mono text-ink-2">glass shadow-glass</p>
            </figure>
            <figure className="flex flex-col rounded-lg glass-strong p-6 shadow-glass-strong">
              <p className="type-ui-strong">Glass/Strong</p>
              <p className="type-mono text-ink-2">
                glass-strong shadow-glass-strong
              </p>
            </figure>
          </div>
          <Rows>
            {tokens.blur.map((b) => (
              <Row
                key={b.name}
                preview={<span className="type-mono">{b.value}</span>}
                name={b.name}
              />
            ))}
          </Rows>
        </div>
      )}
    </ThemePanels>
  ),
};

export const Typography: Story = {
  render: () => (
    <ThemePanels>
      {() => (
        <Rows>
          {tokens.typography.map((t) => (
            <div key={t.name} className="flex flex-col gap-1 py-4">
              <p className="type-mono text-ink-2">
                {t.name} · {t.figmaFont} · {t.fontSize}/{t.lineHeight} ·{" "}
                {t.letterSpacing} · {t.utility}
              </p>
              <p className={t.utility}>{SAMPLE_EN}</p>
              <p className={`${t.utility} text-ink-2`}>{SAMPLE_BN}</p>
            </div>
          ))}
        </Rows>
      )}
    </ThemePanels>
  ),
};

export const Motion: Story = {
  render: () => (
    <ThemePanels>
      {() => (
        <Rows>
          {[...tokens.duration, ...tokens.easing].map((m) => (
            <Row
              key={m.name}
              preview={
                <span className="group block h-2 w-full rounded-pill bg-line">
                  <span
                    className="block size-2 rounded-pill bg-blue transition-transform group-hover:translate-x-12"
                    style={
                      m.name.startsWith("duration")
                        ? {
                            transitionDuration: `var(${m.cssVar})`,
                            transitionTimingFunction: "var(--easing-out)",
                          }
                        : {
                            transitionDuration: "var(--duration-slow)",
                            transitionTimingFunction: `var(${m.cssVar})`,
                          }
                    }
                  />
                </span>
              }
              name={m.name}
              detail={m.value}
            />
          ))}
        </Rows>
      )}
    </ThemePanels>
  ),
};
