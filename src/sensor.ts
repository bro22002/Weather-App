import { WeatherStation } from './WeatherStation';

/**
 * Simulates fetching data from remote weather sensors asynchronously.
 * Delay is added to mimic real-world network latency.
 */
export async function fetchSensorData(): Promise<WeatherStation[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Sample stations across different regions and conditions
            // (In a real app, this would come from your backend or sensor API.)
            const stations = [
                new WeatherStation('WA-01', 18.5, 65, 12.0, 0.0),   // Mild, no rain
                new WeatherStation('WA-02', 15.2, 88, 24.5, 12.5),  // Cool, wet, breezy
                new WeatherStation('OR-01', 22.1, 50, 8.2, 0.0),    // Warm and dry
                new WeatherStation('NY-01', 5.0, 75, 30.1, 5.2),    // Cold, windy, light rain
                new WeatherStation('FL-01', 31.0, 90, 15.0, 25.4),  // Hot, humid, heavy rain
            ];
            resolve(stations);
        }, 1500); // 1.5 seconds delay
    });
}
