import type { Meta, StoryObj } from '@storybook/react';
import { GlassSplitButton } from './GlassSplitButton';
import { Save } from 'lucide-react';

const meta: Meta<typeof GlassSplitButton> = {
    title: 'Compound/GlassSplitButton',
    component: GlassSplitButton,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSplitButton>;

export const Default: Story = {
    args: {
        label: 'Save Changes',
        options: [
            { label: 'Save Draft', onClick: () => alert('Draft saved') },
            { label: 'Save & Publish', onClick: () => alert('Published') }
        ],
        onMainAction: () => alert('Main action')
    }
}

export const WithIcon: Story = {
    args: {
        label: (
            <>
                <Save className="mr-2 h-4 w-4" />
                Save
            </>
        ),
        options: [
            { label: 'Save as New', onClick: () => console.log('New') },
            { label: 'Overwrite', onClick: () => console.log('Overwrite') }
        ],
        variant: 'primary',
        onMainAction: () => alert('Save clicked')
    }
}
