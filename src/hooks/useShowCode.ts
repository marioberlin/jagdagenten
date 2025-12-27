import { useContext } from 'react';
import { ShowCodeContext, ShowCodeContextType } from '../context/ShowCodeContext';

/**
 * Hook to access show code state
 */
export const useShowCode = (): ShowCodeContextType => {
    const context = useContext(ShowCodeContext);
    if (!context) {
        throw new Error('useShowCode must be used within a ShowCodeProvider');
    }
    return context;
};
