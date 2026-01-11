import type { Meta, StoryObj } from '@storybook/react';
import { GlassSortableList } from './GlassDragDrop';


const meta: Meta<typeof GlassSortableList> = {
    title: 'Layout/GlassDragDrop',
    component: GlassSortableList,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassSortableList>;

const items = [
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' },
];

export const Default: Story = {
    render: () => (
        <GlassSortableList<any> items={items} keyField="id" renderItem={(item) => (
            <div className="p-4 bg-glass-surface rounded mb-2">{item.content}</div>
        )} onReorder={(items) => console.log(items)} />
    ),
};
