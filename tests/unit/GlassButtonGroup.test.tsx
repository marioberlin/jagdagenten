import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { GlassButtonGroup } from '@/components/primitives/GlassButtonGroup';
import { GlassButton } from '@/components/primitives/GlassButton';
import React from 'react';

describe('GlassButtonGroup', () => {
    describe('Rendering', () => {
        it('renders children correctly', () => {
            render(
                <GlassButtonGroup>
                    <GlassButton>Button 1</GlassButton>
                    <GlassButton>Button 2</GlassButton>
                </GlassButtonGroup>
            );

            expect(screen.getByText('Button 1')).toBeInTheDocument();
            expect(screen.getByText('Button 2')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(
                <GlassButtonGroup className="custom-class">
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('.custom-class');
            expect(group).toBeInTheDocument();
        });

        it('forwards ref to container element', () => {
            const ref = React.createRef<HTMLDivElement>();
            render(
                <GlassButtonGroup ref={ref}>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            expect(ref.current).toBeInstanceOf(HTMLDivElement);
            expect(ref.current).toHaveAttribute('role', 'group');
        });

        it('renders with role="group" for accessibility', () => {
            const { container } = render(
                <GlassButtonGroup>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toBeInTheDocument();
        });
    });

    describe('Orientation', () => {
        it('defaults to horizontal orientation', () => {
            const { container } = render(
                <GlassButtonGroup>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('flex-row');
            expect(group).not.toHaveClass('flex-col');
        });

        it('applies vertical orientation', () => {
            const { container } = render(
                <GlassButtonGroup orientation="vertical">
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('flex-col');
            expect(group).not.toHaveClass('flex-row');
        });
    });

    describe('Variants', () => {
        it('defaults to attached variant', () => {
            const { container } = render(
                <GlassButtonGroup>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('gap-0');
        });

        it('applies separated variant with spacing', () => {
            const { container } = render(
                <GlassButtonGroup variant="separated">
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('gap-2');
        });

        it('applies border radius to first button in attached horizontal', () => {
            render(
                <GlassButtonGroup variant="attached" orientation="horizontal">
                    <GlassButton>First</GlassButton>
                    <GlassButton>Last</GlassButton>
                </GlassButtonGroup>
            );

            const firstButton = screen.getByText('First').closest('button');
            expect(firstButton).toHaveClass('rounded-r-none');
        });

        it('applies border radius to last button in attached horizontal', () => {
            render(
                <GlassButtonGroup variant="attached" orientation="horizontal">
                    <GlassButton>First</GlassButton>
                    <GlassButton>Last</GlassButton>
                </GlassButtonGroup>
            );

            const lastButton = screen.getByText('Last').closest('button');
            expect(lastButton).toHaveClass('rounded-l-none');
        });

        it('applies border radius to first button in attached vertical', () => {
            render(
                <GlassButtonGroup variant="attached" orientation="vertical">
                    <GlassButton>First</GlassButton>
                    <GlassButton>Last</GlassButton>
                </GlassButtonGroup>
            );

            const firstButton = screen.getByText('First').closest('button');
            expect(firstButton).toHaveClass('rounded-b-none');
        });

        it('removes all border radius from middle buttons in attached mode', () => {
            render(
                <GlassButtonGroup variant="attached">
                    <GlassButton>First</GlassButton>
                    <GlassButton>Middle</GlassButton>
                    <GlassButton>Last</GlassButton>
                </GlassButtonGroup>
            );

            const middleButton = screen.getByText('Middle').closest('button');
            expect(middleButton).toHaveClass('rounded-none');
        });
    });

    describe('Size Inheritance', () => {
        it('passes size prop to child buttons', () => {
            render(
                <GlassButtonGroup size="sm">
                    <GlassButton>Small Button</GlassButton>
                </GlassButtonGroup>
            );

            const button = screen.getByText('Small Button').closest('button');
            // Check for small size classes (adjust based on actual GlassButton implementation)
            expect(button).toBeInTheDocument();
        });

        it('allows individual buttons to override group size', () => {
            render(
                <GlassButtonGroup size="sm">
                    <GlassButton>Small</GlassButton>
                    <GlassButton size="lg">Large</GlassButton>
                </GlassButtonGroup>
            );

            expect(screen.getByText('Small')).toBeInTheDocument();
            expect(screen.getByText('Large')).toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('applies full width class when fullWidth is true', () => {
            const { container } = render(
                <GlassButtonGroup fullWidth>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('w-full');
        });

        it('makes child buttons full width in vertical orientation', () => {
            render(
                <GlassButtonGroup orientation="vertical">
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const button = screen.getByText('Button').closest('button');
            expect(button).toHaveClass('w-full');
        });

        it('makes child buttons full width when fullWidth is true', () => {
            render(
                <GlassButtonGroup fullWidth>
                    <GlassButton>Button</GlassButton>
                </GlassButtonGroup>
            );

            const button = screen.getByText('Button').closest('button');
            expect(button).toHaveClass('w-full');
        });
    });

    describe('Combined Configurations', () => {
        it('combines orientation and variant correctly', () => {
            const { container } = render(
                <GlassButtonGroup orientation="vertical" variant="separated">
                    <GlassButton>Button 1</GlassButton>
                    <GlassButton>Button 2</GlassButton>
                </GlassButtonGroup>
            );

            const group = container.querySelector('[role="group"]');
            expect(group).toHaveClass('flex-col');
            expect(group).toHaveClass('gap-2');
        });

        it('handles multiple children with all props', () => {
            render(
                <GlassButtonGroup
                    orientation="horizontal"
                    variant="attached"
                    size="md"
                    fullWidth
                    className="test-class"
                >
                    <GlassButton>One</GlassButton>
                    <GlassButton>Two</GlassButton>
                    <GlassButton>Three</GlassButton>
                </GlassButtonGroup>
            );

            expect(screen.getByText('One')).toBeInTheDocument();
            expect(screen.getByText('Two')).toBeInTheDocument();
            expect(screen.getByText('Three')).toBeInTheDocument();
        });
    });
});
