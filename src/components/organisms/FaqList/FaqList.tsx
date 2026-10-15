"use client";

import { Accordion } from "radix-ui";
import type { ReactNode } from "react";

import { Icon } from "@/components/atoms/Icon";
import { cx, focusRing } from "@/components/atoms/states";

// Figma: Prototype › Settings · Help & support › "FAQ" and M42 › "FAQ": a card of questions. Figma
// draws only the closed rows; an open row shows its answer under the question (not in Figma yet).

export interface FaqEntry {
  id: string;
  question: ReactNode;
  answer: ReactNode;
}

export interface FaqListProps {
  items: FaqEntry[];
  /** Open question id (controlled); omit to let the list manage it. */
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

export function FaqList({
  items,
  value,
  onValueChange,
  defaultValue,
  className,
}: FaqListProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      className={cx(
        "flex flex-col rounded-lg border border-line bg-surface p-1 md:rounded-xl md:p-help-faq-pad",
        className,
      )}
    >
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id}>
          <Accordion.Header>
            <Accordion.Trigger
              className={cx(
                "group flex min-h-help-faq-row-height w-full items-center gap-3 rounded-md px-3 py-3 text-left md:px-help-faq-row-pad",
                "transition-colors duration-fast ease-out hover:bg-canvas",
                focusRing,
              )}
            >
              <span className="min-w-0 flex-1 type-help-faq-question text-ink">
                {item.question}
              </span>
              <Icon
                name="arrow-down-01"
                className="size-help-faq-icon shrink-0 text-ink transition-transform duration-fast ease-out group-data-[state=open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-3 pb-4 type-ui text-ink-2 md:px-help-faq-row-pad">
            {item.answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
