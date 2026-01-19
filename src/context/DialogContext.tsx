/**
 * Dialog Context
 * 
 * Global state management for modal dialogs.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DialogState {
    aboutLiquidOS: boolean;
}

interface DialogContextValue {
    dialogs: DialogState;
    openDialog: (dialog: keyof DialogState) => void;
    closeDialog: (dialog: keyof DialogState) => void;
    toggleDialog: (dialog: keyof DialogState) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dialogs, setDialogs] = useState<DialogState>({
        aboutLiquidOS: false,
    });

    const openDialog = useCallback((dialog: keyof DialogState) => {
        setDialogs(prev => ({ ...prev, [dialog]: true }));
    }, []);

    const closeDialog = useCallback((dialog: keyof DialogState) => {
        setDialogs(prev => ({ ...prev, [dialog]: false }));
    }, []);

    const toggleDialog = useCallback((dialog: keyof DialogState) => {
        setDialogs(prev => ({ ...prev, [dialog]: !prev[dialog] }));
    }, []);

    return (
        <DialogContext.Provider value={{ dialogs, openDialog, closeDialog, toggleDialog }}>
            {children}
        </DialogContext.Provider>
    );
};

export const useDialogs = (): DialogContextValue => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialogs must be used within a DialogProvider');
    }
    return context;
};

export default DialogContext;
