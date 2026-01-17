import type { Meta, StoryObj } from '@storybook/react';
import { GlassA2UIRenderer } from './GlassA2UIRenderer';
import { restaurantFinderExamples } from '../../a2a/examples/restaurant-finder';
import { rizzchartsExamples } from '../../a2a/examples/rizzcharts';

const meta: Meta<typeof GlassA2UIRenderer> = {
    title: 'Agentic/GlassA2UIRenderer',
    component: GlassA2UIRenderer,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: `
# GlassA2UIRenderer

Renders A2UI payloads from external A2A-compliant agents using the Liquid Glass component system.

## Features
- Transforms A2UI JSON to Glass components
- Supports streaming/progressive rendering
- Data binding with path resolution
- Action handling for interactive elements

## A2A Protocol
The Agent-to-Agent (A2A) protocol enables AI agents to communicate and collaborate.
A2UI is the UI extension that allows agents to generate rich interfaces.

Learn more:
- [A2A Protocol](https://a2a-protocol.org)
- [A2UI Specification](https://a2ui.org)
                `,
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        messages: {
            description: 'A2UI messages to render',
        },
        streaming: {
            control: 'boolean',
            description: 'Enable streaming mode animation',
        },
        loading: {
            control: 'boolean',
            description: 'Show loading state',
        },
        validate: {
            control: 'boolean',
            description: 'Enable payload validation',
        },
    },
};

export default meta;
type Story = StoryObj<typeof GlassA2UIRenderer>;

// Restaurant Finder Examples
export const RestaurantList: Story = {
    name: 'Restaurant List',
    args: {
        messages: restaurantFinderExamples.singleColumnList,
        onAction: (actionId, data) => console.log('Action:', actionId, data),
    },
};

export const RestaurantBookingForm: Story = {
    name: 'Booking Form',
    args: {
        messages: restaurantFinderExamples.bookingForm,
        onAction: (actionId, data) => console.log('Action:', actionId, data),
    },
};

export const BookingConfirmation: Story = {
    name: 'Booking Confirmation',
    args: {
        messages: restaurantFinderExamples.confirmation,
    },
};

// RizzCharts Examples
export const SalesDashboard: Story = {
    name: 'Sales Dashboard',
    args: {
        messages: rizzchartsExamples.salesDashboard,
    },
};

export const LocationMap: Story = {
    name: 'Location Map',
    args: {
        messages: rizzchartsExamples.locationMap,
    },
};

export const CryptoPortfolio: Story = {
    name: 'Crypto Portfolio',
    args: {
        messages: rizzchartsExamples.cryptoPortfolio,
        onAction: (actionId, data) => console.log('Portfolio action:', actionId, data),
    },
};

export const TradingInterface: Story = {
    name: 'Trading Interface',
    args: {
        messages: rizzchartsExamples.tradingInterface,
        onAction: (actionId, data) => console.log('Trade action:', actionId, data),
    },
};

// State Examples
export const Loading: Story = {
    name: 'Loading State',
    args: {
        messages: [],
        loading: true,
    },
};

export const Empty: Story = {
    name: 'Empty State',
    args: {
        messages: [],
    },
};

export const Streaming: Story = {
    name: 'Streaming Mode',
    args: {
        messages: rizzchartsExamples.salesDashboard,
        streaming: true,
    },
};

// Interactive Example
export const Interactive: Story = {
    name: 'Interactive Demo',
    args: {
        messages: restaurantFinderExamples.bookingForm,
    },
    render: (args) => {
        return (
            <div className="space-y-4">
                <div className="text-sm text-secondary mb-4">
                    <p>This demo shows A2UI rendering with action handling.</p>
                    <p>Check the console for action events when interacting with buttons.</p>
                </div>
                <GlassA2UIRenderer
                    {...args}
                    onAction={(actionId, data) => {
                        console.log('Action triggered:', actionId, data);
                        alert(`Action: ${actionId}\nData: ${JSON.stringify(data, null, 2)}`);
                    }}
                />
            </div>
        );
    },
};
