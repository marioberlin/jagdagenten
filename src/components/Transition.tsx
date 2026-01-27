/**
 * Transition Components
 *
 * Reusable animation components for page/view transitions.
 * Uses CSS transitions for better performance.
 */
import React, { useState, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

type TransitionType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  className?: string;
  onEnter?: () => void;
  onExit?: () => void;
  unmountOnExit?: boolean;
}

// ============================================================================
// Transition Component
// ============================================================================

export const Transition: React.FC<TransitionProps> = ({
  show,
  children,
  type = 'fade',
  duration = 200,
  delay = 0,
  className = '',
  onEnter,
  onExit,
  unmountOnExit = true,
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        onEnter?.();
      }, 10 + delay);
    } else {
      setIsVisible(false);
      onExit?.();
      if (unmountOnExit) {
        timeoutRef.current = setTimeout(() => {
          setShouldRender(false);
        }, duration);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [show, duration, delay, onEnter, onExit, unmountOnExit]);

  if (!shouldRender && unmountOnExit) {
    return null;
  }

  const transitionStyles = getTransitionStyles(type, isVisible, duration);

  return (
    <div
      className={className}
      style={{
        ...transitionStyles,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </div>
  );
};

// ============================================================================
// Animated List
// ============================================================================

interface AnimatedListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  type?: TransitionType;
  duration?: number;
  className?: string;
  itemClassName?: string;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 50,
  type = 'fade',
  duration = 200,
  className = '',
  itemClassName = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <Transition
          key={index}
          show={true}
          type={type}
          duration={duration}
          delay={index * staggerDelay}
          className={itemClassName}
        >
          {child}
        </Transition>
      ))}
    </div>
  );
};

// ============================================================================
// Page Transition
// ============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string | number;
  type?: TransitionType;
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  type = 'fade',
  duration = 200,
  className = '',
}) => {
  const [currentKey, setCurrentKey] = useState(transitionKey);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentKey(transitionKey);
        setCurrentChildren(children);
        setIsTransitioning(false);
      }, duration / 2);
    } else {
      setCurrentChildren(children);
    }
  }, [transitionKey, children, currentKey, duration]);

  return (
    <Transition
      show={!isTransitioning}
      type={type}
      duration={duration / 2}
      className={className}
      unmountOnExit={false}
    >
      {currentChildren}
    </Transition>
  );
};

// ============================================================================
// Collapse Transition
// ============================================================================

interface CollapseProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const Collapse: React.FC<CollapseProps> = ({
  show,
  children,
  duration = 200,
  className = '',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(show ? 'auto' : 0);

  useEffect(() => {
    if (show) {
      const contentHeight = contentRef.current?.scrollHeight || 0;
      setHeight(contentHeight);
      // After animation, set to auto for dynamic content
      const timeout = setTimeout(() => setHeight('auto'), duration);
      return () => clearTimeout(timeout);
    } else {
      // First set to actual height, then to 0
      const contentHeight = contentRef.current?.scrollHeight || 0;
      setHeight(contentHeight);
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [show, duration]);

  return (
    <div
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        overflow: 'hidden',
        transition: `height ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
      className={className}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

function getTransitionStyles(
  type: TransitionType,
  isVisible: boolean,
  _duration: number
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
  };

  const hiddenStyles: Record<TransitionType, React.CSSProperties> = {
    none: {},
    fade: { opacity: 0 },
    'slide-up': { opacity: 0, transform: 'translateY(10px)' },
    'slide-down': { opacity: 0, transform: 'translateY(-10px)' },
    'slide-left': { opacity: 0, transform: 'translateX(10px)' },
    'slide-right': { opacity: 0, transform: 'translateX(-10px)' },
    scale: { opacity: 0, transform: 'scale(0.95)' },
  };

  const visibleStyles: Record<TransitionType, React.CSSProperties> = {
    none: {},
    fade: { opacity: 1 },
    'slide-up': { opacity: 1, transform: 'translateY(0)' },
    'slide-down': { opacity: 1, transform: 'translateY(0)' },
    'slide-left': { opacity: 1, transform: 'translateX(0)' },
    'slide-right': { opacity: 1, transform: 'translateX(0)' },
    scale: { opacity: 1, transform: 'scale(1)' },
  };

  return {
    ...baseStyle,
    ...(isVisible ? visibleStyles[type] : hiddenStyles[type]),
  };
}

// ============================================================================
// CSS Animation Classes (for Tailwind)
// ============================================================================

export const animationClasses = {
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  scaleIn: 'animate-scaleIn',
  scaleOut: 'animate-scaleOut',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
} as const;

// Add these to tailwind.config.js:
// animation: {
//   fadeIn: 'fadeIn 0.2s ease-out',
//   fadeOut: 'fadeOut 0.2s ease-in',
//   slideUp: 'slideUp 0.2s ease-out',
//   slideDown: 'slideDown 0.2s ease-out',
//   scaleIn: 'scaleIn 0.2s ease-out',
//   scaleOut: 'scaleOut 0.2s ease-in',
// },
// keyframes: {
//   fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
//   fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
//   slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
//   slideDown: { from: { opacity: 0, transform: 'translateY(-10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
//   scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
//   scaleOut: { from: { opacity: 1, transform: 'scale(1)' }, to: { opacity: 0, transform: 'scale(0.95)' } },
// },

export default Transition;
