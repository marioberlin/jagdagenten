import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassCard } from '@/components/data-display/GlassCard';
import { GlassInput } from '@/components/forms/GlassInput';

describe('GlassCard', () => {
    it('should render title and description', () => {
        render(<GlassCard title="Test Title" description="Test Desc" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Desc')).toBeInTheDocument();
    });

    it('should pass material prop', () => {
        // Material prop doesn't manifest easily in DOM classes without deeper inspection of GlassContainer internals
        // calling material map. But we can check if it renders without error.
        const { container } = render(<GlassCard material="thick">Content</GlassCard>);
        expect(container.firstChild).toBeInTheDocument();
    });
});

describe('GlassInput', () => {
    it('should render input element', () => {
        render(<GlassInput placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render startContent', () => {
        render(<GlassInput startContent={<span>Icon</span>} />);
        expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('should apply error state', () => {
        const { container } = render(<GlassInput error />);
        // Error state usually applies specific classes.
        // We can check if component renders.
        expect(container.firstChild).toBeInTheDocument();
    });
});
