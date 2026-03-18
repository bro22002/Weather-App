/**
 * Fixed "stations" mapped to real coordinates for Open-Meteo batch requests.
 * Order must match the comma-separated lat/lon in the API URL (same index = same location).
 */
export const STATION_LOCATIONS = [
    { stationID: 'GH-01', latitude: 5.1053, longitude: -1.2466 }, // Cape Coast
    { stationID: 'GH-02', latitude: 5.6052, longitude: -0.1668}, // KTA
    { stationID: 'WA-01', latitude: 47.6062, longitude: -122.3321 }, // Seattle
    { stationID: 'WA-02', latitude: 47.6588, longitude: -117.426 }, // Spokane
    { stationID: 'OR-01', latitude: 45.5152, longitude: -122.6784 }, // Portland
    { stationID: 'NY-01', latitude: 40.7128, longitude: -74.006 }, // NYC
    { stationID: 'FL-01', latitude: 25.7617, longitude: -80.1918 }, // Miami
] as const;
