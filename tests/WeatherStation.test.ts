import { WeatherStation } from '../src/WeatherStation';

describe('WeatherStation Class', () => {
    it('should properly instantiate with given parameters', () => {
        const station = new WeatherStation('TEST-01', 25.5, 60, 15.0, 5.0);
        
        expect(station.stationID).toBe('TEST-01');
        expect(station.temperature).toBe(25.5);
        expect(station.humidity).toBe(60);
        expect(station.windSpeed).toBe(15.0);
        expect(station.precipitation).toBe(5.0);
    });

    it('should generate a formatted summary string', () => {
        const station = new WeatherStation('TEST-02', 10.123, 40, 5.678, 1.234);
        const summary = station.getSummary();
        
        // check that properties are rounded to 1 decimal place in the string
        expect(summary).toContain('[TEST-02]');
        expect(summary).toContain('Temp: 10.1°C');
        expect(summary).toContain('Humidity: 40%');
        expect(summary).toContain('Wind: 5.7 km/h');
        expect(summary).toContain('Precip: 1.2 mm');
    });
});
