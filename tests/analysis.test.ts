import { WeatherStation } from '../src/WeatherStation';
import { calculateAverageWindSpeed, calculateAveragePrecipitation } from '../src/analysis';

describe('Recursive Analysis Functions', () => {
    let mockStations: WeatherStation[];

    beforeEach(() => {
        mockStations = [
            new WeatherStation('S1', 20, 50, 10, 5),
            new WeatherStation('S2', 22, 55, 20, 15),
            new WeatherStation('S3', 18, 60, 30, 10)
        ];
    });

    describe('calculateAverageWindSpeed', () => {
        it('should correctly calculate the average wind speed recursively', () => {
            // (10 + 20 + 30) / 3 = 20
            const avg = calculateAverageWindSpeed(mockStations);
            expect(avg).toBe(20);
        });

        it('should handle an empty array by returning 0', () => {
            const avg = calculateAverageWindSpeed([]);
            expect(avg).toBe(0);
        });
    });

    describe('calculateAveragePrecipitation', () => {
        it('should correctly calculate the average precipitation recursively', () => {
            // (5 + 15 + 10) / 3 = 10
            const avg = calculateAveragePrecipitation(mockStations);
            expect(avg).toBe(10);
        });

        it('should handle an empty array by returning 0', () => {
            const avg = calculateAveragePrecipitation([]);
            expect(avg).toBe(0);
        });
    });
});
