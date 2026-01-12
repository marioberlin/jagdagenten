/**
 * A2UI Examples Index
 *
 * Re-exports all A2UI examples for easy import.
 */

export { restaurantFinderExamples, default as restaurantFinder } from './restaurant-finder';
export { rizzchartsExamples, default as rizzcharts } from './rizzcharts';

// Import all examples for convenience
import { restaurantFinderExamples } from './restaurant-finder';
import { rizzchartsExamples } from './rizzcharts';

/**
 * All available A2UI examples
 */
export const allExamples = {
    restaurant: restaurantFinderExamples,
    charts: rizzchartsExamples,
};

export default allExamples;
