import { WeatherStation } from './WeatherStation';
import { STATION_LOCATIONS, type StationLocation } from './stationLocations';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/** Open-Meteo multi-location URLs stay under practical limits when batched. */
export const OPEN_METEO_BATCH_SIZE = 80;

function toNumber(value: unknown): number {
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
}

async function fetchOpenMeteoChunk(locations: readonly StationLocation[]): Promise<WeatherStation[]> {
    const latitudes = locations.map((s) => s.latitude).join(',');
    const longitudes = locations.map((s) => s.longitude).join(',');
    const params = new URLSearchParams({
        latitude: latitudes,
        longitude: longitudes,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        precipitation_unit: 'mm',
    });
    const url = `${OPEN_METEO_BASE}?${params.toString()}`;

    const response = await fetch(url);
    const body: unknown = await response.json();

    if (!response.ok) {
        const reason =
            typeof body === 'object' &&
            body !== null &&
            'reason' in body &&
            typeof (body as { reason: unknown }).reason === 'string'
                ? (body as { reason: string }).reason
                : response.statusText;
        throw new Error(`Open-Meteo request failed (${response.status}): ${reason}`);
    }

    if (
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        (body as { error: unknown }).error === true
    ) {
        const reason =
            'reason' in body && typeof (body as { reason: unknown }).reason === 'string'
                ? (body as { reason: string }).reason
                : 'Unknown API error';
        throw new Error(`Open-Meteo error: ${reason}`);
    }

    const items = Array.isArray(body) ? body : [body];
    if (items.length !== locations.length) {
        throw new Error(
            `Expected ${locations.length} location results from Open-Meteo, got ${items.length}`
        );
    }

    return locations.map((loc, i) => {
        const item = items[i] as {
            current?: {
                temperature_2m?: number;
                relative_humidity_2m?: number;
                wind_speed_10m?: number;
                precipitation?: number;
            };
        };
        const c = item.current;
        if (!c) {
            throw new Error(`Open-Meteo returned no "current" block for station ${loc.stationID}`);
        }
        return new WeatherStation(
            loc.stationID,
            toNumber(c.temperature_2m),
            toNumber(c.relative_humidity_2m),
            toNumber(c.wind_speed_10m),
            toNumber(c.precipitation),
            loc.latitude,
            loc.longitude,
            loc.docId
        );
    });
}

/**
 * Fetches current conditions for all configured stations (batched Open-Meteo requests).
 * @see https://open-meteo.com/en/docs
 */
export async function fetchSensorData(): Promise<WeatherStation[]> {
    const all: WeatherStation[] = [];
    for (let i = 0; i < STATION_LOCATIONS.length; i += OPEN_METEO_BATCH_SIZE) {
        const chunk = STATION_LOCATIONS.slice(i, i + OPEN_METEO_BATCH_SIZE);
        const part = await fetchOpenMeteoChunk(chunk);
        all.push(...part);
    }
    return all;
}
