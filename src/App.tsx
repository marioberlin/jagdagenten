import { useEffect } from 'react';
import { AppRouter } from './Router';
import { GlassProvider } from './context/GlassContext';
import { GlassToastProvider } from '@/components';
import { DialogProvider } from './context/DialogContext';
import { GlobalDialogs } from './components/dialogs/GlobalDialogs';
import { hasLegacyData, isMigrationComplete, migrateLegacyResources } from '@/applications/ai-explorer/migrateLegacy';

function App() {
    // One-time migration of localStorage resources to PostgreSQL
    useEffect(() => {
        if (hasLegacyData() && !isMigrationComplete()) {
            migrateLegacyResources().then(result => {
                if (result.migrated > 0) {
                    console.log(`[App] Migrated ${result.migrated} legacy resources to PostgreSQL`);
                }
                if (result.errors.length > 0) {
                    console.warn('[App] Migration errors:', result.errors);
                }
            });
        }
    }, []);

    return (
        <GlassProvider>
            <DialogProvider>
                <GlassToastProvider>
                    <AppRouter />
                    <GlobalDialogs />
                </GlassToastProvider>
            </DialogProvider>
        </GlassProvider>
    );
}

export default App;

