import { WeatherStation } from './WeatherStation';

/**
 * Recursively calculates the total wind speed from a list of stations.
 * @param stations Array of WeatherStation objects
 * @param index Current index being processed
 * @returns Total sum of wind speeds
 */
function calculateTotalWindSpeed(stations: WeatherStation[], index: number = 0): number {
    // Base case: if we have reached the end of the array, return 0
    if (index >= stations.length) {
        return 0;
    }
    // Recursive case: current item's wind speed + sum of the rest
    return stations[index].windSpeed + calculateTotalWindSpeed(stations, index + 1);
}

/**
 * Calculate the average wind speed in km/h across the given stations.
 * Returns 0 when there are no stations (avoids NaN and division-by-zero).
 */
export function calculateAverageWindSpeed(stations: WeatherStation[]): number {
    if (stations.length === 0) return 0;
    const totalWindSpeed = calculateTotalWindSpeed(stations);
    return totalWindSpeed / stations.length;
}

/**
 * Sums precipitation (mm) across all stations via tail recursion.
 * Same pattern as wind — one station at a time, then the rest.
 */
function calculateTotalPrecipitation(stations: WeatherStation[], index: number = 0): number {
    // Base case: if we have reached the end of the array, return 0
    if (index >= stations.length) {
        return 0;
    }
    // Recursive case: current item's precipitation + sum of the rest
    return stations[index].precipitation + calculateTotalPrecipitation(stations, index + 1);
}

/**
 * Calculates the average precipitation utilizing a recursive helper function.
 * Returns 0 when there are no stations.
 */
export function calculateAveragePrecipitation(stations: WeatherStation[]): number {
    if (stations.length === 0) return 0;
    const totalPrecipitation = calculateTotalPrecipitation(stations);
    return totalPrecipitation / stations.length;
}
