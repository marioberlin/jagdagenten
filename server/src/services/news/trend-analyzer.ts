/**
 * Trend Analyzer Service
 * 
 * Analyzes wildlife sighting patterns, news topics, and regional activity.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendData {
    id: string;
    type: 'species' | 'region' | 'topic' | 'seasonal';
    label: string;
    currentCount: number;
    previousCount: number;
    changePercent: number;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    timeWindow: '24h' | '7d' | '30d';
    metadata?: Record<string, unknown>;
}

interface RegionalHotspot {
    gridCell: string;
    bundesland: string;
    species: string;
    activityScore: number;
    sightingCount: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}

interface SeasonalPattern {
    species: string;
    month: number;
    expectedActivityLevel: 'low' | 'medium' | 'high' | 'peak';
    notes: string;
}

// ---------------------------------------------------------------------------
// Seasonal Baselines
// ---------------------------------------------------------------------------

const SEASONAL_PATTERNS: SeasonalPattern[] = [
    // Schwarzwild
    { species: 'schwarzwild', month: 1, expectedActivityLevel: 'high', notes: 'Drückjagdsaison' },
    { species: 'schwarzwild', month: 2, expectedActivityLevel: 'medium', notes: 'Ende Drückjagd' },
    { species: 'schwarzwild', month: 3, expectedActivityLevel: 'low', notes: 'Schonzeit Bachen' },
    { species: 'schwarzwild', month: 4, expectedActivityLevel: 'low', notes: 'Frischzeit' },
    { species: 'schwarzwild', month: 5, expectedActivityLevel: 'medium', notes: 'Frischlinge unterwegs' },
    { species: 'schwarzwild', month: 6, expectedActivityLevel: 'medium', notes: 'Suhlen aktiv' },
    { species: 'schwarzwild', month: 7, expectedActivityLevel: 'medium', notes: 'Maisfelder' },
    { species: 'schwarzwild', month: 8, expectedActivityLevel: 'high', notes: 'Ernteschäden' },
    { species: 'schwarzwild', month: 9, expectedActivityLevel: 'high', notes: 'Mastzeit beginnt' },
    { species: 'schwarzwild', month: 10, expectedActivityLevel: 'peak', notes: 'Eichen/Buchenmast' },
    { species: 'schwarzwild', month: 11, expectedActivityLevel: 'peak', notes: 'Drückjagden starten' },
    { species: 'schwarzwild', month: 12, expectedActivityLevel: 'high', notes: 'Drückjagdsaison' },

    // Rotwild
    { species: 'rotwild', month: 9, expectedActivityLevel: 'peak', notes: 'Brunft' },
    { species: 'rotwild', month: 10, expectedActivityLevel: 'high', notes: 'Nachbrunft' },

    // Wolf
    { species: 'wolf', month: 4, expectedActivityLevel: 'high', notes: 'Welpenzeit' },
    { species: 'wolf', month: 5, expectedActivityLevel: 'high', notes: 'Jungtiere' },
    { species: 'wolf', month: 10, expectedActivityLevel: 'high', notes: 'Jungwölfe wandern' },
    { species: 'wolf', month: 11, expectedActivityLevel: 'high', notes: 'Territoriale Aktivität' },
];

// ---------------------------------------------------------------------------
// Analysis Functions
// ---------------------------------------------------------------------------

export function calculateTrend(
    currentCount: number,
    previousCount: number,
): Pick<TrendData, 'changePercent' | 'direction' | 'confidence'> {
    if (previousCount === 0) {
        return {
            changePercent: currentCount > 0 ? 100 : 0,
            direction: currentCount > 0 ? 'up' : 'stable',
            confidence: currentCount > 5 ? 0.8 : 0.4,
        };
    }

    const changePercent = ((currentCount - previousCount) / previousCount) * 100;

    let direction: 'up' | 'down' | 'stable';
    if (changePercent > 10) direction = 'up';
    else if (changePercent < -10) direction = 'down';
    else direction = 'stable';

    // Confidence based on sample size
    const totalSamples = currentCount + previousCount;
    let confidence = 0.5;
    if (totalSamples > 100) confidence = 0.9;
    else if (totalSamples > 50) confidence = 0.8;
    else if (totalSamples > 20) confidence = 0.7;
    else if (totalSamples > 10) confidence = 0.6;

    return { changePercent: Math.round(changePercent * 10) / 10, direction, confidence };
}

export function getSeasonalExpectation(species: string, month: number): SeasonalPattern | undefined {
    return SEASONAL_PATTERNS.find(p => p.species === species && p.month === month);
}

export function isUnusualActivity(
    species: string,
    currentCount: number,
    month: number,
    historicalAverage: number,
): boolean {
    const seasonal = getSeasonalExpectation(species, month);

    // Apply seasonal multiplier
    let expectedMultiplier = 1;
    switch (seasonal?.expectedActivityLevel) {
        case 'peak': expectedMultiplier = 2.0; break;
        case 'high': expectedMultiplier = 1.5; break;
        case 'medium': expectedMultiplier = 1.0; break;
        case 'low': expectedMultiplier = 0.5; break;
    }

    const seasonallyAdjustedExpected = historicalAverage * expectedMultiplier;

    // Unusual if more than 2x or less than 0.3x expected
    return currentCount > seasonallyAdjustedExpected * 2 || currentCount < seasonallyAdjustedExpected * 0.3;
}

// ---------------------------------------------------------------------------
// Hotspot Detection
// ---------------------------------------------------------------------------

interface SightingAggregate {
    gridCell: string;
    bundesland: string;
    species: string;
    count: number;
    timeWindow: string;
}

export function detectHotspots(
    aggregates: SightingAggregate[],
    previousAggregates: SightingAggregate[],
): RegionalHotspot[] {
    const hotspots: RegionalHotspot[] = [];

    // Group by gridCell
    const currentByCell = new Map<string, SightingAggregate[]>();
    for (const agg of aggregates) {
        const existing = currentByCell.get(agg.gridCell) || [];
        existing.push(agg);
        currentByCell.set(agg.gridCell, existing);
    }

    const previousByCell = new Map<string, SightingAggregate[]>();
    for (const agg of previousAggregates) {
        const existing = previousByCell.get(agg.gridCell) || [];
        existing.push(agg);
        previousByCell.set(agg.gridCell, existing);
    }

    // Calculate activity scores
    for (const [gridCell, sightings] of currentByCell.entries()) {
        const totalCount = sightings.reduce((sum, s) => sum + s.count, 0);
        const previousSightings = previousByCell.get(gridCell) || [];
        const previousTotal = previousSightings.reduce((sum, s) => sum + s.count, 0);

        // Activity score: combination of absolute count and change
        const activityScore = totalCount * (1 + (totalCount - previousTotal) / Math.max(previousTotal, 1));

        // Only include if activity score is significant
        if (activityScore > 5) {
            let trend: 'increasing' | 'stable' | 'decreasing';
            if (totalCount > previousTotal * 1.2) trend = 'increasing';
            else if (totalCount < previousTotal * 0.8) trend = 'decreasing';
            else trend = 'stable';

            // Get primary species
            const speciesCounts = new Map<string, number>();
            for (const s of sightings) {
                speciesCounts.set(s.species, (speciesCounts.get(s.species) || 0) + s.count);
            }
            const primarySpecies = [...speciesCounts.entries()]
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

            hotspots.push({
                gridCell,
                bundesland: sightings[0]?.bundesland || 'Unknown',
                species: primarySpecies,
                activityScore: Math.round(activityScore * 10) / 10,
                sightingCount: totalCount,
                trend,
            });
        }
    }

    // Sort by activity score
    return hotspots.sort((a, b) => b.activityScore - a.activityScore).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Topic Trend Analysis (for news)
// ---------------------------------------------------------------------------

interface TopicCount {
    topic: string;
    count: number;
}

export function analyzeTopicTrends(
    currentTopics: TopicCount[],
    previousTopics: TopicCount[],
): TrendData[] {
    const trends: TrendData[] = [];
    const previousMap = new Map(previousTopics.map(t => [t.topic, t.count]));

    for (const current of currentTopics) {
        const previous = previousMap.get(current.topic) || 0;
        const { changePercent, direction, confidence } = calculateTrend(current.count, previous);

        trends.push({
            id: `topic-${current.topic}`,
            type: 'topic',
            label: current.topic,
            currentCount: current.count,
            previousCount: previous,
            changePercent,
            direction,
            confidence,
            timeWindow: '7d',
        });
    }

    // Sort by absolute change, descending
    return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
}

// ---------------------------------------------------------------------------
// Summary Generator
// ---------------------------------------------------------------------------

export interface TrendSummary {
    topSpeciesTrends: TrendData[];
    hotspots: RegionalHotspot[];
    unusualPatterns: string[];
    seasonalNotes: string[];
}

export function generateTrendSummary(
    speciesTrends: TrendData[],
    hotspots: RegionalHotspot[],
    month: number,
): TrendSummary {
    const unusualPatterns: string[] = [];
    const seasonalNotes: string[] = [];

    // Add seasonal notes for current month
    const monthPatterns = SEASONAL_PATTERNS.filter(p => p.month === month);
    for (const pattern of monthPatterns) {
        if (pattern.expectedActivityLevel === 'peak' || pattern.expectedActivityLevel === 'high') {
            seasonalNotes.push(`${pattern.species}: ${pattern.notes}`);
        }
    }

    // Detect unusual patterns
    for (const trend of speciesTrends) {
        if (trend.direction === 'up' && trend.changePercent > 50) {
            unusualPatterns.push(`Starker Anstieg bei ${trend.label} (+${trend.changePercent}%)`);
        }
        if (trend.direction === 'down' && trend.changePercent < -50) {
            unusualPatterns.push(`Deutlicher Rückgang bei ${trend.label} (${trend.changePercent}%)`);
        }
    }

    return {
        topSpeciesTrends: speciesTrends.slice(0, 5),
        hotspots: hotspots.slice(0, 5),
        unusualPatterns,
        seasonalNotes,
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export type { TrendData, RegionalHotspot, SeasonalPattern, SightingAggregate, TopicCount };
