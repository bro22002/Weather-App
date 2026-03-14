/**
 * A single weather station’s snapshot: one place, one moment in time.
 *
 * Holds the core readings we care about (temp, humidity, wind, rain)
 * and knows how to turn them into a short, readable summary for logs and reports.
 */
export class WeatherStation {
    constructor(
        /** Unique identifier for this station (e.g. "WA-01", "NY-01") */
        public stationID: string,
        /** Temperature in Celsius */
        public temperature: number,
        /** Relative humidity, 0–100% */
        public humidity: number,
        /** Wind speed in km/h */
        public windSpeed: number,
        /** Precipitation in mm (rain/snow equivalent) */
        public precipitation: number
    ) {}

    // Method to display a simple summary of the station's data
    public getSummary(): string {
        return `[${this.stationID}] Temp: ${this.temperature.toFixed(1)}°C | Humidity: ${this.humidity}% | Wind: ${this.windSpeed.toFixed(1)} km/h | Precip: ${this.precipitation.toFixed(1)} mm`;
    }
}
