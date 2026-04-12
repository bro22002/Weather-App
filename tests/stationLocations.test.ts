import { STATION_LOCATIONS } from '../src/stationLocations';

describe('GIS station configuration', () => {
    it('defines exactly 195 UN-style sovereign capitals (193 members + VA + PS)', () => {
        expect(STATION_LOCATIONS.length).toBe(195);
    });

    it('every station has coordinates and a stable Firestore doc id', () => {
        for (const s of STATION_LOCATIONS) {
            expect(typeof s.latitude).toBe('number');
            expect(typeof s.longitude).toBe('number');
            expect(s.docId).toMatch(/^[A-Z0-9]{2}$/);
            expect(s.stationID.length).toBeGreaterThan(0);
        }
    });
});
