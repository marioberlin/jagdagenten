import React from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { SurfaceContainer } from '../primitives/SurfaceContainer';
import { cn } from '@/utils/cn';
import { Slot } from '@radix-ui/react-slot';

import { GlassComponentProps, GlassMaterial } from '@/components/types';

interface GlassCardProps extends GlassComponentProps {
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    /** Enable keyboard focus with visible focus ring */
    focusable?: boolean;
    /** 'widget' for translucent glass, 'content' for opaque surface */
    variant?: 'widget' | 'content';
    material?: GlassMaterial | string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, title, description, children, footer, focusable, variant = 'widget', material, asChild = false, ...props }, ref) => {
        const Container = variant === 'content' ? SurfaceContainer : GlassContainer;
        const defaultMaterial = variant === 'content' ? 'elevated' : 'surface';

        // If composition is used, we wrap the functional logic inside the Slot
        // However, GlassContainer and SurfaceContainer already accept 'as' or are polymorphic?
        // Actually, Slot works by merging props.
        // But GlassContainer renders structure.
        // A Slot pattern on a high-level component like GlassCard is tricky if it has internal structure (title, footer).
        // If asChild is true, we assume the child handles the structure OR we assume the child IS the container.

        // The standard 'asChild' pattern simply replaces the ROOT element.
        // GlassCard's root is the Container.
        // So we can pass 'asChild' to the Container if it supported it.
        // But GlassContainer doesn't support 'asChild' natively yet? Wait, GlassContainer uses GlassButton refs? No.
        // GlassContainer renders a 'div' or 'as' prop.

        // Simpler approach for now:
        // Use Slot for the root container only if asChild is strictly requested for custom behavior,
        // but typically GlassCard is a layout component.
        // If the user wants to make the CARD a link, they wrap it or we allow 'asChild' on the Container?

        // Let's implement Slot logic manually if needed or delegate.
        // Since GlassContainer/SurfaceContainer don't export 'asChild' yet (we didn't refactor them in this step),
        // we can wrap them in a Slot? No, Slot expects a valid React Element child.

        // Actually, let's keep it simple: If asChild is true, we use Slot as the root component.
        // But we must render the internal content (Title, etc.) inside that Slot?
        // No, usually 'asChild' means "I am passing the implementation of the root node".
        // The *children* of GlassCard defined in JSX will be passed to that root node.
        // Checks logic:
        // <GlassCard asChild>
        //   <a href="...">Content</a>
        // </GlassCard>
        // Result: <a href="..." className="glass-card-classes">...Content (plus Title/Footer if rendered?)</a>...
        // Wait, if I supply children to GlassCard, where do they go vs the <a ...> child?
        // Standard Slot pattern:
        // function Button({ asChild, children, ...props }) {
        //   const Comp = asChild ? Slot : 'button'
        //   return <Comp {...props}>{children}</Comp>
        // }
        // Usage: <Button asChild><a href="/">Click me</a></Button> (children 'Click me' of 'a' are rendered)

        // For GlassCard, it has structured content (title, footer).
        // If asChild is enabled, can we still guarantee structure?
        // Ideally, 'asChild' replaces the *container*.
        // So we render:
        // <Comp ...containerProps>
        //    {title && ...}
        //    {children}
        //    {footer && ...}
        // </Comp>



        // Container specific props need to be handled.
        // Slot forwards all props.
        // But Container expects 'material', 'border', etc.
        // Slot doesn't know what to do with 'material'.
        // So if asChild is used, we might lose Glass styling unless we manually apply classes?
        // OR we refactor GlassContainer to support asChild too.

        // For this task, let's refactor GlassContainer to support 'asChild' first?
        // Or assume 'asChild' on GlassCard means just the wrapper flexibility.

        // Let's use the explicit logic:
        // If asChild, we assume the user provides a component that *accepts* the glass classes.
        // We will pass className.

        return (
            <Container
                ref={ref}
                as={asChild ? Slot : 'div'} // Container supports 'as' which can be Slot!
                material={(material as any) || defaultMaterial}
                tabIndex={focusable ? 0 : undefined}
                className={cn(
                    'flex flex-col',
                    focusable && 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    className
                )}
                {...props}
            >
                {(title || description) && (
                    <div className="flex flex-col space-y-1.5 p-6">
                        {title && <h3 className="font-semibold leading-none tracking-tight text-primary">{title}</h3>}
                        {description && <p className="text-sm text-secondary">{description}</p>}
                    </div>
                )}
                <div className="p-6 pt-0">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center p-6 pt-0 text-secondary">
                        {footer}
                    </div>
                )}
            </Container>
        );
    }
);

GlassCard.displayName = "GlassCard";

