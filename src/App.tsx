import { AppRouter } from './Router';
import { GlassProvider } from './context/GlassContext';
import { GlassToastProvider } from '@/components';
import { DialogProvider } from './context/DialogContext';
import { GlobalDialogs } from './components/dialogs/GlobalDialogs';

function App() {
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

