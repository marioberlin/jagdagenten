import type { Meta, StoryObj } from '@storybook/react';
import { GlassTimeline } from './GlassTimeline';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const meta: Meta<typeof GlassTimeline> = {
    title: 'Data Display/GlassTimeline',
    component: GlassTimeline,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTimeline>;

export const Default: Story = {
    render: () => (
        <GlassTimeline
            items={[
                {
                    id: '1',
                    title: "Project Started",
                    date: "Jan 1, 2024",
                    description: "Initial requirements gathering and team setup.",
                    icon: <CheckCircle2 size={16} className="text-green-400" />
                },
                {
                    id: '2',
                    title: "Design Phase",
                    date: "Jan 15, 2024",
                    description: "UI/UX design sprints completed.",
                    icon: <CheckCircle2 size={16} className="text-green-400" />
                },
                {
                    id: '3',
                    title: "Development",
                    date: "Current",
                    description: "Core features implementation in progress.",
                    icon: <Clock size={16} className="text-blue-400" />
                },
                {
                    id: '4',
                    title: "Launch",
                    date: "Expected Mar 2024",
                    description: "Public beta release.",
                    icon: <Circle size={16} />
                }
            ]}
        />
    ),
};
