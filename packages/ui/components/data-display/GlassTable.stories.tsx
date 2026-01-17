import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { GlassTable, type GlassTableProps } from './GlassTable';
import { GlassBadge } from './GlassBadge';

const GlassTableAsset = GlassTable as <T extends Asset>(props: GlassTableProps<T>) => React.ReactElement;

const meta: Meta<typeof GlassTableAsset> = {
    title: 'Data Display/GlassTable',
    component: GlassTable,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassTableAsset>;

interface Asset {
    id: string;
    name: string;
    symbol: string;
    balance: number;
    value: string;
    status: 'active' | 'pending' | 'locked';
}

const mockData: Asset[] = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', balance: 0.25, value: '$10,245.50', status: 'active' },
    { id: '2', name: 'Ethereum', symbol: 'ETH', balance: 3.5, value: '$6,820.10', status: 'active' },
    { id: '3', name: 'Solana', symbol: 'SOL', balance: 45.0, value: '$4,500.00', status: 'locked' },
    { id: '4', name: 'Cardano', symbol: 'ADA', balance: 1200, value: '$600.00', status: 'pending' },
];

export const Default: Story = {
    args: {
        keyField: 'id',
        data: mockData,
        columns: [
            { header: 'Asset', accessor: 'name' },
            { header: 'Symbol', accessor: 'symbol' },
            { header: 'Balance', accessor: (item: Asset) => item.balance.toFixed(2) },
            { header: 'Value', accessor: 'value' },
        ],
    },
};

export const WithCustomCells: Story = {
    args: {
        keyField: 'id',
        data: mockData,
        columns: [
            {
                header: 'Asset',
                accessor: (item: Asset) => (
                    <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-xs text-secondary">{item.symbol}</span>
                    </div>
                )
            },
            { header: 'Value', accessor: 'value' },
            {
                header: 'Status',
                accessor: (item: Asset) => (
                    <GlassBadge variant={item.status === 'active' ? 'default' : item.status === 'locked' ? 'destructive' : 'secondary'}>
                        {item.status}
                    </GlassBadge>
                )
            },
        ],
    },
};

export const Clickable: Story = {
    args: {
        keyField: 'id',
        data: mockData,
        columns: [
            { header: 'Name', accessor: 'name' },
            { header: 'Balance', accessor: (item: Asset) => item.balance.toString() },
        ],
        onRowClick: (item: Asset) => alert(`Clicked on ${item.name}`),
    },
};
