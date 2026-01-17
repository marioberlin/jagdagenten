import type { Meta, StoryObj } from '@storybook/react';
import { GlassAccordion, GlassAccordionItem, GlassAccordionTrigger, GlassAccordionContent } from './GlassAccordion';

const meta: Meta<typeof GlassAccordion> = {
    title: 'Layout/GlassAccordion',
    component: GlassAccordion,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassAccordion>;

export const Default: Story = {
    render: () => (
        <GlassAccordion type="single" collapsible className="w-full">
            <GlassAccordionItem value="item-1">
                <GlassAccordionTrigger>Is it accessible?</GlassAccordionTrigger>
                <GlassAccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                </GlassAccordionContent>
            </GlassAccordionItem>
            <GlassAccordionItem value="item-2">
                <GlassAccordionTrigger>Is it styled?</GlassAccordionTrigger>
                <GlassAccordionContent>
                    Yes. It comes with default styles that matches the other
                    components&apos; aesthetic.
                </GlassAccordionContent>
            </GlassAccordionItem>
            <GlassAccordionItem value="item-3">
                <GlassAccordionTrigger>Is it animated?</GlassAccordionTrigger>
                <GlassAccordionContent>
                    Yes. It&apos;s animated by default, but you can disable it if you
                    prefer.
                </GlassAccordionContent>
            </GlassAccordionItem>
        </GlassAccordion>
    ),
};
