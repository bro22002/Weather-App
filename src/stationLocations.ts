import worldCapitals from './data/worldCapitals.json';

/**
 * National capitals for the 195 entities usually counted as “world countries”:
 * 193 UN member states (REST Countries `unMember`, plus Guinea-Bissau `GW` where the API
 * omits the flag) plus Vatican City (`VA`) and Palestine (`PS`) as UN observer states.
 * Coordinates from REST Countries `capitalInfo`. `docId` = ISO 3166-1 alpha-2 (Firestore doc id).
 */
export interface StationLocation {
    docId: string;
    stationID: string;
    latitude: number;
    longitude: number;
}

export const STATION_LOCATIONS = worldCapitals as readonly StationLocation[];
