import type { Meta, StoryObj } from '@storybook/react';
import { GlassScanner } from './GlassScanner';


const meta: Meta<typeof GlassScanner> = {
    title: 'Media/GlassScanner',
    component: GlassScanner,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassScanner>;

export const Default: Story = {
    render: () => {
        // const [result, setResult] = useState<string | null>(null);

        return (
            <div className="space-y-4">
                <div className="w-[400px] h-[300px] bg-black rounded-lg overflow-hidden relative">
                    <GlassScanner />
                </div>
            </div>
        )
    },
};
