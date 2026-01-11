import type { Meta, StoryObj } from '@storybook/react';
import { GlassCombobox } from './GlassCombobox';
import { useState } from 'react';

const meta: Meta<typeof GlassCombobox> = {
    title: 'Forms/GlassCombobox',
    component: GlassCombobox,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCombobox>;

const frameworks = [
    { value: "next.js", label: "Next.js" },
    { value: "sveltekit", label: "SvelteKit" },
    { value: "nuxt.js", label: "Nuxt.js" },
    { value: "remix", label: "Remix" },
    { value: "astro", label: "Astro" },
];

export const Default: Story = {
    render: () => {
        const [value, setValue] = useState("");
        return (
            <GlassCombobox
                options={frameworks}
                value={value}
                onValueChange={setValue}
                placeholder="Select framework..."
                emptyText="No framework found."
            />
        );
    },
};
