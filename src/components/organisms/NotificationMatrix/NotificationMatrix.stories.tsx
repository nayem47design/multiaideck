import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Stepper } from "@/components/molecules/Stepper";

import { NotificationMatrix } from "./NotificationMatrix";

function frame(width: number) {
  return function Frame(Story: () => React.JSX.Element) {
    return (
      <div style={{ width }}>
        <Story />
      </div>
    );
  };
}

const type = (
  id: string,
  title: string,
  help: string,
  inApp: boolean,
  email: boolean,
) => ({
  id,
  title,
  help,
  values: { app: inApp, email },
});

const meta = {
  title: "Organisms/Notification matrix",
  component: NotificationMatrix,
  parameters: {
    docs: {
      description: {
        component: "Figma: Design system › Notification matrix (103:21145).",
      },
    },
  },
  args: {
    channels: [
      { id: "app", label: "In-app" },
      { id: "email", label: "Email" },
    ],
    groups: [
      {
        label: "MONEY",
        types: [
          {
            ...type(
              "low",
              "Low balance alert",
              "When your balance drops below your limit.",
              true,
              true,
            ),
            extra: (
              <p className="flex items-center gap-2">
                <span className="type-setting-row-help text-ink-2">
                  Alert me below
                </span>
                <Stepper
                  value={500}
                  onValueChange={() => {}}
                  valueLabel="500 credits"
                  decreaseLabel="Lower"
                  increaseLabel="Higher"
                />
                <span className="type-setting-row-help text-ink-3">
                  ≈ BDT 5 · about 19 chats
                </span>
              </p>
            ),
          },
          {
            ...type(
              "receipts",
              "Payment receipts",
              "After every successful top-up.",
              true,
              true,
            ),
            lockedLabel: "Always on",
          },
        ],
      },
      {
        label: "USAGE",
        types: [
          type(
            "weekly",
            "Weekly usage summary",
            "Credits used per model, every Sunday.",
            false,
            true,
          ),
        ],
      },
      {
        label: "RELIABILITY",
        types: [
          type(
            "failed",
            "Failed answers",
            "When a model fails to respond. You are not charged.",
            true,
            false,
          ),
        ],
      },
      {
        label: "PRODUCT",
        types: [
          type(
            "models",
            "New models",
            "When a new model becomes available.",
            true,
            false,
          ),
          type(
            "offers",
            "Offers and discounts",
            "Credit pack deals. Off unless you turn it on.",
            false,
            false,
          ),
        ],
      },
    ],
    onChange: () => {},
  },
  decorators: [frame(824)],
} satisfies Meta<typeof NotificationMatrix>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
