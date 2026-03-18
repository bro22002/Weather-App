import { fetchSensorData } from '../src/sensor';
import { STATION_LOCATIONS } from '../src/stationLocations';

const makeOpenMeteoItem = (overrides: Partial<{
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
}> = {}) => ({
    latitude: 0,
    longitude: 0,
    current: {
        time: '2026-01-01T12:00',
        interval: 900,
        temperature_2m: 20,
        relative_humidity_2m: 50,
        wind_speed_10m: 10,
        precipitation: 0,
        ...overrides,
    },
});

describe('fetchSensorData (Open-Meteo)', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('maps batched Open-Meteo JSON to WeatherStation[] in station order', async () => {
        const payload = STATION_LOCATIONS.map((loc, i) =>
            makeOpenMeteoItem({
                temperature_2m: 10 + i,
                relative_humidity_2m: 60 + i,
                wind_speed_10m: 5 + i * 2,
                precipitation: i * 0.5,
            })
        );

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => payload,
        }) as unknown as typeof fetch;

        const stations = await fetchSensorData();

        expect(stations).toHaveLength(STATION_LOCATIONS.length);
        expect(stations[0].stationID).toBe('WA-01');
        expect(stations[0].temperature).toBe(10);
        expect(stations[0].humidity).toBe(60);
        expect(stations[0].windSpeed).toBe(5);
        expect(stations[0].precipitation).toBe(0);
        expect(stations[4].stationID).toBe('FL-01');
        expect(stations[4].temperature).toBe(14);
    });

    it('throws when HTTP response is not ok', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({ error: true, reason: 'bad param' }),
        }) as unknown as typeof fetch;

        await expect(fetchSensorData()).rejects.toThrow(/Open-Meteo request failed \(400\)/);
    });

    it('throws when API returns error: true with 200', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ error: true, reason: 'Invalid variable' }),
        }) as unknown as typeof fetch;

        await expect(fetchSensorData()).rejects.toThrow(/Open-Meteo error: Invalid variable/);
    });

    it('throws when result count does not match station config', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => [makeOpenMeteoItem()],
        }) as unknown as typeof fetch;

        await expect(fetchSensorData()).rejects.toThrow(/Expected 5 location results/);
    });

    it('defaults missing numeric fields in current to 0', async () => {
        const payload = STATION_LOCATIONS.map(() => ({
            current: { time: '2026-01-01T12:00', interval: 900 },
        }));
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => payload,
        }) as unknown as typeof fetch;

        const stations = await fetchSensorData();
        expect(stations[0].temperature).toBe(0);
        expect(stations[0].humidity).toBe(0);
        expect(stations[0].windSpeed).toBe(0);
        expect(stations[0].precipitation).toBe(0);
    });
});
