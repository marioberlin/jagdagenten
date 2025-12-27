import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ShowCodeContextType {
    showCode: boolean;
    setShowCode: (value: boolean) => void;
    toggleShowCode: () => void;
}

// Export context for use in hook file
export const ShowCodeContext = createContext<ShowCodeContextType | undefined>(undefined);

export const ShowCodeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [showCode, setShowCodeState] = useState(false);

    // Set window variable so GlassCode can read it without needing context
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).__SHOW_CODE_CONTEXT__ = showCode;
        }
    }, [showCode]);

    const setShowCode = (value: boolean) => {
        setShowCodeState(value);
    };

    const toggleShowCode = () => setShowCodeState(prev => !prev);

    return (
        <ShowCodeContext.Provider value={{ showCode, setShowCode, toggleShowCode }}>
            {children}
        </ShowCodeContext.Provider>
    );
};

// Wrapper component for conditional code display
interface CodeBlockProps {
    children: ReactNode;
    className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, className = '' }) => {
    // Use context directly to avoid circular dependency with hook file
    const context = useContext(ShowCodeContext);
    if (!context) {
        throw new Error('CodeBlock must be used within a ShowCodeProvider');
    }
    const { showCode } = context;

    if (!showCode) return null;

    return <div className={className}>{children}</div>;
};
