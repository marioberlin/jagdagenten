import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with necessary providers
 * (Currently no providers needed as Zustand is global, but keeping wrapper structure for future extensibility)
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
