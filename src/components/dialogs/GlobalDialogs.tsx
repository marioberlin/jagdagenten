/**
 * GlobalDialogs
 * 
 * Renders all global dialogs that can be triggered from anywhere in the app.
 */

import React from 'react';
import { useDialogs } from '@/context/DialogContext';
import { AboutLiquidOSDialog } from '@/components/dialogs/AboutLiquidOSDialog';

export const GlobalDialogs: React.FC = () => {
    const { dialogs, closeDialog } = useDialogs();

    return (
        <>
            <AboutLiquidOSDialog
                isOpen={dialogs.aboutLiquidOS}
                onClose={() => closeDialog('aboutLiquidOS')}
            />
        </>
    );
};

export default GlobalDialogs;
