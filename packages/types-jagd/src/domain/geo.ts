export type GeoMode = 'none' | 'coarse_grid' | 'precise';

export interface GeoScope {
  mode: GeoMode;
  gridId?: string;
  lat?: number;
  lon?: number;
  blurMeters?: number;
}
