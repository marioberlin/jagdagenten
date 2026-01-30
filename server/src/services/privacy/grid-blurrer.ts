/**
 * Grid Blurrer Service
 *
 * Converts precise GPS coordinates to coarse grid cells for privacy.
 * Uses a 5km grid system to prevent exact location exposure while
 * still allowing meaningful spatial aggregation.
 *
 * Grid Cell Format: {country}-{state}-{gridId}
 * Example: "DE-NW-5234"
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Grid cell size in kilometers */
export const GRID_CELL_SIZE_KM = 5;

/** Earth's radius in km */
const EARTH_RADIUS_KM = 6371;

/** German federal state codes */
const BUNDESLAND_CODES: Record<string, string> = {
    'Baden-Württemberg': 'BW',
    'Bayern': 'BY',
    'Berlin': 'BE',
    'Brandenburg': 'BB',
    'Bremen': 'HB',
    'Hamburg': 'HH',
    'Hessen': 'HE',
    'Mecklenburg-Vorpommern': 'MV',
    'Niedersachsen': 'NI',
    'Nordrhein-Westfalen': 'NW',
    'Rheinland-Pfalz': 'RP',
    'Saarland': 'SL',
    'Sachsen': 'SN',
    'Sachsen-Anhalt': 'ST',
    'Schleswig-Holstein': 'SH',
    'Thüringen': 'TH',
};

/** Approximate center of Germany for grid reference */
const GERMANY_CENTER = {
    lat: 51.1657,
    lng: 10.4515,
};

// ---------------------------------------------------------------------------
// Grid Calculation Functions
// ---------------------------------------------------------------------------

/**
 * Convert latitude/longitude to a grid cell ID
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param cellSizeKm - Grid cell size in km (default: 5)
 * @returns Grid cell ID (e.g., "DE-NW-5234")
 */
export function latLngToGridCell(
    lat: number,
    lng: number,
    cellSizeKm: number = GRID_CELL_SIZE_KM
): string {
    // Calculate degrees per km at this latitude
    const latPerKm = 1 / 111; // ~111km per degree latitude
    const lngPerKm = 1 / (111 * Math.cos((lat * Math.PI) / 180));

    // Calculate cell size in degrees
    const latCellSize = cellSizeKm * latPerKm;
    const lngCellSize = cellSizeKm * lngPerKm;

    // Calculate grid position relative to reference point
    const latOffset = Math.floor((lat - GERMANY_CENTER.lat) / latCellSize);
    const lngOffset = Math.floor((lng - GERMANY_CENTER.lng) / lngCellSize);

    // Create a unique grid ID from the offsets
    // Use a simple encoding: (latOffset * 1000 + lngOffset) with offset to avoid negatives
    const gridId = ((latOffset + 500) * 1000 + (lngOffset + 500)).toString();

    // Determine Bundesland from coordinates (approximate)
    const bundeslandCode = getBundeslandCode(lat, lng);

    return `DE-${bundeslandCode}-${gridId}`;
}

/**
 * Get the center coordinates of a grid cell
 *
 * @param gridCell - Grid cell ID
 * @returns [latitude, longitude] of cell center
 */
export function getGridCellCenter(gridCell: string): [number, number] {
    const parts = gridCell.split('-');
    if (parts.length !== 3) {
        throw new Error(`Invalid grid cell format: ${gridCell}`);
    }

    const gridId = parseInt(parts[2], 10);
    const latOffset = Math.floor(gridId / 1000) - 500;
    const lngOffset = (gridId % 1000) - 500;

    const latPerKm = 1 / 111;
    const lat = GERMANY_CENTER.lat + latOffset * GRID_CELL_SIZE_KM * latPerKm;

    const lngPerKm = 1 / (111 * Math.cos((lat * Math.PI) / 180));
    const lng = GERMANY_CENTER.lng + lngOffset * GRID_CELL_SIZE_KM * lngPerKm;

    // Return center of cell (add half cell size)
    return [
        lat + (GRID_CELL_SIZE_KM * latPerKm) / 2,
        lng + (GRID_CELL_SIZE_KM * lngPerKm) / 2,
    ];
}

/**
 * Calculate approximate bounding box for a grid cell
 *
 * @param gridCell - Grid cell ID
 * @returns Bounding box { north, south, east, west }
 */
export function getGridCellBounds(gridCell: string): {
    north: number;
    south: number;
    east: number;
    west: number;
} {
    const [centerLat, centerLng] = getGridCellCenter(gridCell);

    const latPerKm = 1 / 111;
    const lngPerKm = 1 / (111 * Math.cos((centerLat * Math.PI) / 180));

    const halfCellLat = (GRID_CELL_SIZE_KM * latPerKm) / 2;
    const halfCellLng = (GRID_CELL_SIZE_KM * lngPerKm) / 2;

    return {
        north: centerLat + halfCellLat,
        south: centerLat - halfCellLat,
        east: centerLng + halfCellLng,
        west: centerLng - halfCellLng,
    };
}

/**
 * Check if a point is within a grid cell
 */
export function isPointInGridCell(
    lat: number,
    lng: number,
    gridCell: string
): boolean {
    const calculatedCell = latLngToGridCell(lat, lng);
    return calculatedCell === gridCell;
}

/**
 * Get neighboring grid cells (8 directions)
 */
export function getNeighboringCells(gridCell: string): string[] {
    const parts = gridCell.split('-');
    if (parts.length !== 3) return [];

    const country = parts[0];
    const state = parts[1];
    const gridId = parseInt(parts[2], 10);

    const latOffset = Math.floor(gridId / 1000);
    const lngOffset = gridId % 1000;

    const neighbors: string[] = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
    ];

    for (const [dLat, dLng] of directions) {
        const newLatOffset = latOffset + dLat;
        const newLngOffset = lngOffset + dLng;
        const newGridId = newLatOffset * 1000 + newLngOffset;
        neighbors.push(`${country}-${state}-${newGridId}`);
    }

    return neighbors;
}

// ---------------------------------------------------------------------------
// Bundesland Detection (Approximate)
// ---------------------------------------------------------------------------

/**
 * Get approximate Bundesland code from coordinates
 * This is a simplified version - a production system would use
 * proper GeoJSON boundary checking
 */
function getBundeslandCode(lat: number, lng: number): string {
    // Simplified bounding boxes for German states
    // In production, use proper polygon containment checks

    // Bavaria (BY)
    if (lat < 50.5 && lat > 47.2 && lng > 9.0 && lng < 13.8) return 'BY';

    // Baden-Württemberg (BW)
    if (lat < 49.8 && lat > 47.5 && lng > 7.5 && lng < 10.5) return 'BW';

    // Nordrhein-Westfalen (NW)
    if (lat < 52.5 && lat > 50.3 && lng > 5.8 && lng < 9.5) return 'NW';

    // Niedersachsen (NI)
    if (lat < 54.0 && lat > 51.3 && lng > 6.5 && lng < 11.6) return 'NI';

    // Hessen (HE)
    if (lat < 51.7 && lat > 49.4 && lng > 7.7 && lng < 10.2) return 'HE';

    // Sachsen (SN)
    if (lat < 51.7 && lat > 50.2 && lng > 11.8 && lng < 15.0) return 'SN';

    // Brandenburg (BB)
    if (lat < 53.6 && lat > 51.3 && lng > 11.2 && lng < 14.8) return 'BB';

    // Schleswig-Holstein (SH)
    if (lat > 53.3 && lng < 11.3) return 'SH';

    // Mecklenburg-Vorpommern (MV)
    if (lat > 53.0 && lng > 10.5) return 'MV';

    // Default fallback
    return 'XX';
}

// ---------------------------------------------------------------------------
// Display Helpers
// ---------------------------------------------------------------------------

/**
 * Format grid cell for display
 * @returns Human-readable location string
 */
export function formatGridCellForDisplay(gridCell: string): string {
    const parts = gridCell.split('-');
    if (parts.length !== 3) return 'Unbekannt';

    const stateCode = parts[1];
    const stateName = Object.entries(BUNDESLAND_CODES).find(
        ([_, code]) => code === stateCode
    )?.[0];

    return stateName ? `Region ${stateName}` : `Region ${stateCode}`;
}

/**
 * Get Bundesland full name from code
 */
export function getBundeslandFromCode(code: string): string | undefined {
    return Object.entries(BUNDESLAND_CODES).find(
        ([_, c]) => c === code
    )?.[0];
}

export default {
    latLngToGridCell,
    getGridCellCenter,
    getGridCellBounds,
    isPointInGridCell,
    getNeighboringCells,
    formatGridCellForDisplay,
    getBundeslandFromCode,
    GRID_CELL_SIZE_KM,
};
