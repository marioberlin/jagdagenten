import { AppRouter } from './Router';
import { GlassProvider } from './context/GlassContext';
import { GlassToastProvider } from '@/components';

function App() {
    return (
        <GlassProvider>
            <GlassToastProvider>
                <AppRouter />
            </GlassToastProvider>
        </GlassProvider>
    );
}

export default App;
