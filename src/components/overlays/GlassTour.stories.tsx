import type { Meta, StoryObj } from '@storybook/react';
import { GlassTour } from './GlassTour';
import { GlassButton } from '../primitives/GlassButton';

const meta: Meta<typeof GlassTour> = {
    title: 'Overlays/GlassTour',
    component: GlassTour,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTour>;

const steps = [
    {
        target: '.tour-step-1',
        title: 'Welcome',
        content: 'This is the first step of the tour.',
    },
    {
        target: '.tour-step-2',
        title: 'Features',
        content: 'Here are some cool features.',
    },
    {
        target: '.tour-step-3',
        title: 'Get Started',
        content: 'Click here to begin your journey.',
    }
];

export const Default: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <GlassTour steps={steps} isOpen={true} />
            <div className="tour-step-1 p-4 border border-glass-border rounded">Step 1 Target</div>
            <div className="tour-step-2 p-4 border border-glass-border rounded">Step 2 Target</div>
            <div className="tour-step-3"><GlassButton>Step 3 Target</GlassButton></div>
        </div>
    ),
};
