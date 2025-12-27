import React, { createContext, useContext, useState, useRef } from 'react';
import { GlassContainer } from '../primitives/GlassContainer';
import { cn } from '@/utils/cn';
import { useSpring, animated } from '@react-spring/web';
import { ChevronDown } from 'lucide-react';

// Context
interface AccordionContextType {
    value: string | string[];
    onValueChange: (value: string) => void;
    type: 'single' | 'multiple';
}
const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

// Root
interface GlassAccordionProps {
    type?: 'single' | 'multiple';
    collapsible?: boolean;
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    children: React.ReactNode;
    className?: string;
}
export const GlassAccordion = ({ type = 'single', value: controlledValue, defaultValue, onValueChange, children, className }: GlassAccordionProps) => {
    // Logic: if type is multiple or collapsible (implicit), allows empty.
    const [internalValue, setInternalValue] = useState<string | string[]>(
        defaultValue || (type === 'multiple' ? [] : '')
    );
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = (itemValue: string) => {
        let newValue: string | string[];
        if (type === 'single') {
            newValue = value === itemValue ? '' : itemValue;
        } else {
            const arr = Array.isArray(value) ? value : [];
            newValue = arr.includes(itemValue) ? arr.filter(v => v !== itemValue) : [...arr, itemValue];
        }
        setInternalValue(newValue);
        onValueChange?.(newValue);
    };

    return (
        <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
            <div className={cn("space-y-2", className)}>{children}</div>
        </AccordionContext.Provider>
    );
};

// Item
interface GlassAccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}
export const GlassAccordionItem = React.forwardRef<HTMLDivElement, GlassAccordionItemProps>(
    ({ className, value, children, ...props }, ref) => {
        return (
            <GlassContainer material="thin" className={cn("overflow-hidden", className)} ref={ref} {...props}>
                {React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child, { itemValue: value } as Partial<typeof child.props>);
                    }
                    return child;
                })}
            </GlassContainer>
        );
    }
);
GlassAccordionItem.displayName = "GlassAccordionItem";

// Trigger
interface GlassAccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    itemValue?: string; // Injected by Item
}
export const GlassAccordionTrigger = React.forwardRef<HTMLButtonElement, GlassAccordionTriggerProps>(
    ({ className, children, itemValue, ...props }, ref) => {
        const context = useContext(AccordionContext);
        if (!context) throw new Error("Trigger must be within Accordion");

        const isOpen = Array.isArray(context.value)
            ? context.value.includes(itemValue!)
            : context.value === itemValue;

        const { rotation } = useSpring({
            rotation: isOpen ? 180 : 0,
            config: { tension: 300, friction: 20 }
        });

        return (
            <button
                ref={ref}
                onClick={() => context.onValueChange(itemValue!)}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 px-6 font-medium transition-all hover:text-primary w-full text-left",
                    isOpen ? "text-primary" : "text-secondary",
                    className
                )}
                {...props}
            >
                {children}
                <animated.div style={{ transform: rotation.to(r => `rotate(${r}deg)`) }}>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" />
                </animated.div>
            </button>
        );
    }
);
GlassAccordionTrigger.displayName = "GlassAccordionTrigger";

// Content
interface GlassAccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
    itemValue?: string; // Injected by Item
}
export const GlassAccordionContent = React.forwardRef<HTMLDivElement, GlassAccordionContentProps>(
    ({ className, children, itemValue, ...props }, ref) => {
        const context = useContext(AccordionContext);
        const contentRef = useRef<HTMLDivElement>(null);

        const isOpen = context ? (
            Array.isArray(context.value)
                ? context.value.includes(itemValue!)
                : context.value === itemValue
        ) : false;

        const { height, opacity } = useSpring({
            from: { height: 0, opacity: 0 },
            to: {
                height: isOpen ? contentRef.current?.scrollHeight || 'auto' : 0,
                opacity: isOpen ? 1 : 0
            },
            config: { tension: 300, friction: 26 }
        });

        if (!context) return null;

        return (
            <animated.div
                ref={ref}
                style={{ height, opacity, overflow: 'hidden' }}
                className="overflow-hidden"
            >
                <div ref={contentRef} className={cn("px-6 pb-4 pt-0 text-secondary text-sm", className)} {...props}>
                    {children}
                </div>
            </animated.div>
        );
    }
);
GlassAccordionContent.displayName = "GlassAccordionContent";
