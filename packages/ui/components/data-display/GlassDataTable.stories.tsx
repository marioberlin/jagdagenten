import type { Meta, StoryObj } from '@storybook/react';
import { GlassDataTable } from './GlassDataTable';

import { GlassButton } from '../primitives/GlassButton';
import { MoreHorizontal } from 'lucide-react';
import { GlassDropdown, GlassDropdownItem, GlassDropdownLabel, GlassDropdownSeparator } from '../overlays/GlassDropdown';

const GlassDataTablePayment = GlassDataTable;

const meta: Meta<typeof GlassDataTablePayment> = {
    title: 'Data Display/GlassDataTable',
    component: GlassDataTable,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassDataTablePayment>;

type Payment = {
    id: string
    amount: number
    status: "pending" | "processing" | "success" | "failed"
    email: string
}

const data: Payment[] = [
    { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
    { id: "489e1d42", amount: 125, status: "processing", email: "example@gmail.com" },
    { id: "b21a76k2", amount: 450, status: "success", email: "success@test.com" },
    { id: "a52z91b1", amount: 620, status: "failed", email: "failed@test.com" },
    { id: "c18f23x9", amount: 200, status: "success", email: "user@domain.com" },
]

const columns = [
    {
        accessor: "status" as const,
        header: "Status",
        width: "w-[100px]",
    },
    {
        accessor: (item: Payment) => (
            <div className="flex items-center gap-2">
                <span className="truncate">{item.email}</span>
            </div>
        ),
        header: "Email",
        width: "w-[200px]",
    },
    {
        accessor: (item: Payment) => {
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(item.amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
        header: "Amount",
        className: "text-right",
        width: "w-[100px]",
    },
    {
        accessor: (item: Payment) => (
            <GlassDropdown trigger={
                <GlassButton variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </GlassButton>
            } align="right">
                <GlassDropdownLabel>Actions</GlassDropdownLabel>
                <GlassDropdownItem
                    onClick={() => navigator.clipboard.writeText(item.id)}
                >
                    Copy payment ID
                </GlassDropdownItem>
                <GlassDropdownSeparator />
                <GlassDropdownItem>View customer</GlassDropdownItem>
                <GlassDropdownItem>View payment details</GlassDropdownItem>
            </GlassDropdown>
        ),
        header: "Actions",
        width: "w-[50px]",
    },
]

export const Default: Story = {
    render: () => (
        <GlassDataTable columns={columns} data={data} keyField="id" />
    )
};

export const Empty: Story = {
    render: () => (
        <GlassDataTable columns={columns} data={[]} keyField="id" />
    )
}
