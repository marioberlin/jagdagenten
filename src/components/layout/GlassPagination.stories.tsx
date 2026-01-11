import type { Meta, StoryObj } from '@storybook/react';
import { GlassPagination, GlassPaginationContent, GlassPaginationItem, GlassPaginationLink, GlassPaginationNext, GlassPaginationPrevious, GlassPaginationEllipsis } from './GlassPagination';

const meta: Meta<typeof GlassPagination> = {
    title: 'Layout/GlassPagination',
    component: GlassPagination,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassPagination>;

export const Default: Story = {
    render: () => (
        <GlassPagination>
            <GlassPaginationContent>
                <GlassPaginationItem>
                    <GlassPaginationPrevious />
                </GlassPaginationItem>
                <GlassPaginationItem>
                    <GlassPaginationLink>1</GlassPaginationLink>
                </GlassPaginationItem>
                <GlassPaginationItem>
                    <GlassPaginationLink isActive>2</GlassPaginationLink>
                </GlassPaginationItem>
                <GlassPaginationItem>
                    <GlassPaginationLink>3</GlassPaginationLink>
                </GlassPaginationItem>
                <GlassPaginationItem>
                    <GlassPaginationEllipsis />
                </GlassPaginationItem>
                <GlassPaginationItem>
                    <GlassPaginationNext />
                </GlassPaginationItem>
            </GlassPaginationContent>
        </GlassPagination>
    ),
};
