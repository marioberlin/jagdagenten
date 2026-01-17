import type { Meta, StoryObj } from '@storybook/react';
import { GlassSelect } from './GlassSelect';

const meta: Meta<typeof GlassSelect> = {
    title: 'Forms/GlassSelect',
    component: GlassSelect,
    tags: ['autodocs'],
    argTypes: {
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassSelect>;

const defaultOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
    { label: 'Option 4', value: 'opt4' },
    { label: 'Option 5', value: 'opt5' },
];

export const Default: Story = {
    args: {
        options: defaultOptions,
        placeholder: 'Choose an option...',
    },
};

export const Preselected: Story = {
    args: {
        options: defaultOptions,
        defaultValue: 'opt2',
    },
};

export const Disabled: Story = {
    args: {
        options: defaultOptions,
        disabled: true,
        defaultValue: 'opt1',
    },
};

export const LongList: Story = {
    args: {
        options: Array.from({ length: 20 }, (_, i) => ({
            label: `Item ${i + 1}`,
            value: `item${i + 1}`,
        })),
        placeholder: 'Scrollable list...',
    },
};
