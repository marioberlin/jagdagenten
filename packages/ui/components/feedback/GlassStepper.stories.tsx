import type { Meta, StoryObj } from '@storybook/react';
import { GlassStepper } from './GlassStepper';


const meta: Meta<typeof GlassStepper> = {
    title: 'Feedback/GlassStepper',
    component: GlassStepper,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassStepper>;

export const Default: Story = {
    render: () => {
        // const [currentStep, setCurrentStep] = useState(1);
        return (
            <GlassStepper
                steps={[
                    { label: 'Personal Info' },
                    { label: 'Account Details' },
                    { label: 'Confirmation' }
                ]}
                currentStep={1}

            />
        );
    },
};

export const Completed: Story = {
    render: () => (
        <GlassStepper
            steps={[
                { label: 'Phase 1' },
                { label: 'Phase 2' },
                { label: 'Phase 3' }
            ]}
            currentStep={4}
        />
    )
}
