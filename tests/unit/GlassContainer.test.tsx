import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlassContainer } from '@/components/primitives/GlassContainer';

describe('GlassContainer', () => {
    it('should render children content', () => {
        render(
            <GlassContainer>
                <div>Test Content</div>
            </GlassContainer>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(
            <GlassContainer className="custom-class">
                Content
            </GlassContainer>
        );
        // GlassContainer might wrap inside a motion.div
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
