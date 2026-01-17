import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GlassChatWindow } from './GlassChat';

const meta: Meta<typeof GlassChatWindow> = {
    title: 'Features/GlassChat',
    component: GlassChatWindow,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="h-[600px] w-full p-8 bg-app-dark">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof GlassChatWindow>;

const initialMessages = [
    { id: '1', role: 'assistant' as const, content: 'Hello! I am your Liquid Crypto assistant. How can I help you manage your portfolio today?', timestamp: '2:30 PM' },
    { id: '2', role: 'user' as const, content: 'Can you show me my top performing assets?', timestamp: '2:31 PM' },
    { id: '3', role: 'assistant' as const, content: 'Certainly. Your top performers in the last 24h are BTC (+5.2%) and SOL (+8.7%). Would you like to see a detailed chart?', timestamp: '2:31 PM' },
];

const StatefulChat = (args: any) => {
    const [messages, setMessages] = useState([...initialMessages]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = (content: string) => {
        const userMsg = { id: Date.now().toString(), role: 'user' as const, content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: `I've received your message: "${content}". This is a simulated response appearing with a liquid wire thinking state.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);
        }, 2000);
    };

    return <GlassChatWindow {...args} messages={messages} onSend={handleSend} isLoading={isLoading} />;
};

export const Default: Story = {
    render: (args) => <StatefulChat {...args} />,
};

export const Loading: Story = {
    args: {
        messages: initialMessages,
        isLoading: true,
    },
};

export const Empty: Story = {
    args: {
        messages: [],
        title: 'New Conversation',
    },
};
