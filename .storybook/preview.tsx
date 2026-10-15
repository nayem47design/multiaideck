import type { Preview } from "@storybook/nextjs-vite";
import { useEffect } from "react";

import { fontVariables } from "../src/app/fonts";
import "../src/app/globals.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Luminous colour mode",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as string;
      useEffect(() => {
        const html = document.documentElement;
        html.dataset.theme = theme;
        html.classList.add(...fontVariables.split(" "));
      }, [theme]);
      return <Story />;
    },
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
