/**
 * JagdrevierLayers
 *
 * Renders geodata layers (Jagdreviere, Hegeringe, etc.) from the GeoLayer store
 * as pigeon-maps GeoJson overlays. Each layer gets its own color scheme.
 *
 * Must be rendered inside a pigeon-maps <Map> component (receives mapState via cloneElement).
 */

import { useMemo, useState } from 'react';
import { GeoJson, Overlay } from 'pigeon-maps';
import { X, MapPin } from 'lucide-react';
import { useGeoLayerStore, type GeoLayerMeta } from '@/stores/useGeoLayerStore';

// ============================================================================
// Types
// ============================================================================

interface JagdrevierLayersProps {
  /** Pigeon-maps injects these via cloneElement – forwarded to children */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface FeatureInfo {
  layerLabel: string;
  name: string;
  area?: string;
  hegering?: string;
  revierNr?: string;
  anchor: [number, number];
}

// ============================================================================
// Helpers
// ============================================================================

function getFeatureName(props: Record<string, unknown>, layer: GeoLayerMeta): string {
  // Try common name fields
  for (const field of ['Name', 'Eigenjagd', 'Gemeinschaftsjagd', 'JG_Name', 'Revier_Nr']) {
    if (props[field]) return String(props[field]);
  }
  return 'Unbenannt';
}

function getFeatureCenter(geometry: GeoJSON.Geometry): [number, number] | null {
  try {
    let coords: number[][] = [];

    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0] as number[][];
    } else if (geometry.type === 'MultiPolygon') {
      coords = geometry.coordinates[0][0] as number[][];
    } else {
      return null;
    }

    // Simple centroid
    let sumLat = 0, sumLon = 0;
    for (const c of coords) {
      sumLon += c[0];
      sumLat += c[1];
    }
    return [sumLat / coords.length, sumLon / coords.length];
  } catch {
    return null;
  }
}

function formatArea(ha?: number): string {
  if (!ha) return '';
  if (ha >= 100) return `${Math.round(ha)} ha`;
  return `${ha.toFixed(1)} ha`;
}

// ============================================================================
// Feature Info Popup
// ============================================================================

function FeatureInfoPopup({
  info,
  onClose,
  ...pigeonProps
}: {
  info: FeatureInfo;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}) {
  return (
    <Overlay anchor={info.anchor} offset={[0, 10]} {...pigeonProps}>
      <div
        className="p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] backdrop-blur-md shadow-xl min-w-[200px] max-w-[280px]"
        style={{ transform: 'translate(-50%, -100%)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[var(--glass-accent)] flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{info.name}</h4>
              <p className="text-xs text-[var(--text-secondary)]">{info.layerLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-white/10 text-[var(--text-secondary)] flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
        {(info.area || info.hegering || info.revierNr) && (
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)] space-y-1 text-xs text-[var(--text-secondary)]">
            {info.revierNr && <div>Revier-Nr: <span className="text-[var(--text-primary)]">{info.revierNr}</span></div>}
            {info.area && <div>Fläche: <span className="text-[var(--text-primary)]">{info.area}</span></div>}
            {info.hegering && <div>Hegering: <span className="text-[var(--text-primary)]">{info.hegering}</span></div>}
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function JagdrevierLayers({ ...pigeonProps }: JagdrevierLayersProps) {
  const layers = useGeoLayerStore((s) => s.layers);
  const geojson = useGeoLayerStore((s) => s.geojson);
  const visibleLayers = useGeoLayerStore((s) => s.visibleLayers);
  const [selectedFeature, setSelectedFeature] = useState<FeatureInfo | null>(null);

  // Get visible layers with data
  const activeLayers = useMemo(() => {
    return layers.filter(
      (l) => visibleLayers.has(l.id) && geojson[l.id]
    );
  }, [layers, visibleLayers, geojson]);

  return (
    <>
      {activeLayers.map((layer) => {
        const data = geojson[layer.id];
        if (!data) return null;

        return (
          <GeoJson
            key={layer.id}
            data={data}
            styleCallback={() => ({
              fill: layer.color,
              stroke: layer.strokeColor,
              strokeWidth: 2,
            })}
            onClick={({ payload }: { payload: GeoJSON.Feature }) => {
              const props = payload.properties ?? {};
              const center = getFeatureCenter(payload.geometry);
              if (!center) return;

              setSelectedFeature({
                layerLabel: layer.label,
                name: getFeatureName(props, layer),
                area: formatArea(props.Flae_ha as number | undefined),
                hegering: props.Hegering as string | undefined,
                revierNr: props.Revier_Nr as string | undefined,
                anchor: center,
              });
            }}
            {...pigeonProps}
          />
        );
      })}

      {/* Feature info popup */}
      {selectedFeature && (
        <FeatureInfoPopup
          info={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          {...pigeonProps}
        />
      )}
    </>
  );
}

export default JagdrevierLayers;
