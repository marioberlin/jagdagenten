import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassButton } from '@/components/primitives/GlassButton';

describe('GlassButton', () => {
    it('should render children correctly', () => {
        render(<GlassButton>Click Me</GlassButton>);
        expect(screen.getByRole('button')).toHaveTextContent('Click Me');
    });

    it('should handle onClick events', () => {
        const handleClick = vi.fn();
        render(<GlassButton onClick={handleClick}>Click Me</GlassButton>);

        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(<GlassButton disabled>Disabled</GlassButton>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should apply primary variant classes', () => {
        render(<GlassButton variant="primary">Primary</GlassButton>);
        // We can check for specific class names or styles if we want to be strict
        // But usually checking if it renders is enough for unit tests unless visual reg needed
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-accent');
    });

    it('should render loading state', () => {
        render(<GlassButton loading>Loading</GlassButton>);
        expect(screen.getByRole('button')).toBeDisabled();
        // Assuming loading spinner or similar is rendered, or just valid render
    });
});
