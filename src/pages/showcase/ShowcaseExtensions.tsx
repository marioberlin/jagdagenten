import { GlassSpreadsheet } from '../../components/features/GlassSpreadsheet';
import { GlassMap } from '../../components/data-display/GlassMap';
import { GlassFlow } from '../../components/features/GlassFlow';
import { GlassVisualizer } from '../../components/media/GlassVisualizer';
import { GlassScanner } from '../../components/media/GlassScanner';

export function ShowcaseExtensions() {
    return (
        <div className="space-y-12 pb-24 animate-in fade-in duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent">
                    Liquid Extensions
                </h1>
                <p className="text-lg text-white/60 max-w-2xl">
                    Advanced components powered by heavy-duty 3rd party libraries, wrapped in the Liquid Glass aesthetic.
                    These demonstrate complex data visualization, mapping, and media capabilities.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-12">

                {/* Spreadsheet */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white/90">Glass Spreadsheet</h2>
                        <span className="text-xs px-2 py-1 rounded bg-accent-primary/20 text-accent-primary">react-data-grid</span>
                    </div>
                    <p className="text-sm text-white/60">
                        A high-performance data grid capable of handling millions of rows with glass styling.
                    </p>
                    <div className="h-[400px]">
                        <GlassSpreadsheet />
                    </div>
                </div>

                {/* Map */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white/90">Glass Map</h2>
                        <span className="text-xs px-2 py-1 rounded bg-accent-secondary/20 text-accent-secondary">pigeon-maps</span>
                    </div>
                    <p className="text-sm text-white/60">
                        Open-source mapping with custom dark provider and glass overlays.
                    </p>
                    <div className="h-[400px]">
                        <GlassMap />
                    </div>
                </div>

                {/* Flow */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white/90">Glass Flow</h2>
                        <span className="text-xs px-2 py-1 rounded bg-accent-tertiary/20 text-accent-tertiary">reactflow</span>
                    </div>
                    <p className="text-sm text-white/60">
                        Node-based workflow editor. Styled with custom glass nodes and SVG edges.
                    </p>
                    <div className="h-[400px]">
                        <GlassFlow />
                    </div>
                </div>

                {/* Visualizer */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white/90">Glass Visualizer</h2>
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">Canvas API</span>
                    </div>
                    <p className="text-sm text-white/60">
                        Real-time looking audio frequency visualization using HTML5 Canvas.
                    </p>
                    <GlassVisualizer />
                </div>

                {/* Scanner */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white/90">Glass Scanner</h2>
                        <span className="text-xs px-2 py-1 rounded bg-pink-500/20 text-pink-400">react-webcam</span>
                    </div>
                    <p className="text-sm text-white/60">
                        Webcam interface with sci-fi HUD overlay for QR scanning or identity verification.
                    </p>
                    <GlassScanner />
                </div>

            </div>
        </div>
    );
}
