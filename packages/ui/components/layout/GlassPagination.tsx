import React from 'react';
import { GlassButton, GlassButtonProps } from '../primitives/GlassButton';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

const GlassPagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
    <nav
        role="navigation"
        aria-label="pagination"
        className={cn("mx-auto flex w-full justify-center", className)}
        {...props}
    />
);

const GlassPaginationContent = ({ className, ...props }: React.ComponentProps<"ul">) => (
    <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />
);

const GlassPaginationItem = ({ className, ...props }: React.ComponentProps<"li">) => (
    <li className={cn("", className)} {...props} />
);

type GlassPaginationLinkProps = {
    isActive?: boolean;
} & GlassButtonProps;

const GlassPaginationLink = ({
    isActive,
    size = "sm",
    className,
    ...props
}: GlassPaginationLinkProps) => (
    <GlassButton
        variant={isActive ? "primary" : "ghost"}
        size={size}
        className={cn("w-9 h-9 p-0 rounded-full", className)}
        {...props}
    />
);

const GlassPaginationPrevious = ({
    className,
    ...props
}: React.ComponentProps<typeof GlassPaginationLink>) => (
    <GlassPaginationLink
        aria-label="Go to previous page"
        size="sm"
        className={cn("gap-1 px-2.5 w-auto", className)}
        {...props}
    >
        <ChevronLeft size={14} />
        <span>Previous</span>
    </GlassPaginationLink>
);

const GlassPaginationNext = ({
    className,
    ...props
}: React.ComponentProps<typeof GlassPaginationLink>) => (
    <GlassPaginationLink
        aria-label="Go to next page"
        size="sm"
        className={cn("gap-1 px-2.5 w-auto", className)}
        {...props}
    >
        <span>Next</span>
        <ChevronRight size={14} />
    </GlassPaginationLink>
);

const GlassPaginationEllipsis = ({
    className,
    ...props
}: React.ComponentProps<"span">) => (
    <span
        aria-hidden
        className={cn("flex h-9 w-9 items-center justify-center text-secondary", className)}
        {...props}
    >
        <MoreHorizontal size={14} />
        <span className="sr-only">More pages</span>
    </span>
);

GlassPagination.displayName = 'GlassPagination';
GlassPaginationContent.displayName = 'GlassPaginationContent';
GlassPaginationItem.displayName = 'GlassPaginationItem';
GlassPaginationLink.displayName = 'GlassPaginationLink';
GlassPaginationPrevious.displayName = 'GlassPaginationPrevious';
GlassPaginationNext.displayName = 'GlassPaginationNext';
GlassPaginationEllipsis.displayName = 'GlassPaginationEllipsis';

export {
    GlassPagination,
    GlassPaginationContent,
    GlassPaginationItem,
    GlassPaginationLink,
    GlassPaginationPrevious,
    GlassPaginationNext,
    GlassPaginationEllipsis,
};
