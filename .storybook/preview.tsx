import type { Preview } from "@storybook/react";
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../src/context/ThemeContext';
import { GlassProvider } from '../src/context/GlassContext';
import { LiquidFilter } from '../src/components/Effects/LiquidFilter';

// Import global styles
import '../src/styles/tokens.css';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'liquid-dark',
      values: [
        {
          name: 'liquid-dark',
          value: '#0A0A0B',
        },
        {
          name: 'liquid-light',
          value: '#F5F5F7',
        },
      ],
    },
    layout: 'centered',
    a11y: {
      test: 'todo', // 'todo' - show a11y violations in the test UI only
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <GlassProvider>
          <MemoryRouter>
            <div className="dark bg-app-dark min-h-screen p-8 text-primary relative overflow-hidden">
              {/* Simulating the Aurora background if possible, or just a deep dark surface */}
              <div className="absolute inset-0 bg-[#0A0A0B] -z-20" />
              <div
                className="absolute inset-0 -z-10 opacity-50"
                style={{
                  background: 'radial-gradient(circle at 50% -20%, #3a3a3a, #0a0a0b)',
                }}
              />
              <LiquidFilter />
              <div className="relative z-10">
                <Story />
              </div>
            </div>
          </MemoryRouter>
        </GlassProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;