/**
 * A single weather station's snapshot: one place, one moment in time.
 *
 * Holds the core readings we care about (temp, humidity, wind, rain)
 * and knows how to turn them into a short, readable summary for logs and reports.
 * Optional latitude/longitude allow the station to be plotted on a GIS map.
 */
export class WeatherStation {
    constructor(
        /** Unique display identifier (e.g. city name, capital label) */
        public stationID: string,
        /** Temperature in Celsius */
        public temperature: number,
        /** Relative humidity, 0–100% */
        public humidity: number,
        /** Wind speed in km/h */
        public windSpeed: number,
        /** Precipitation in mm (rain/snow equivalent) */
        public precipitation: number,
        /** Geographic latitude (decimal degrees) — required for GIS map markers */
        public latitude?: number,
        /** Geographic longitude (decimal degrees) — required for GIS map markers */
        public longitude?: number,
        /** Firestore document ID when loaded from the cloud (may differ from stationID) */
        public documentId?: string,
        /** Client-side last-write time from Firestore `timestamp` when present */
        public updatedAt?: Date
    ) {}

    /** Firestore path id: prefer cloud document id over display label */
    get idForFirestore(): string {
        return this.documentId ?? this.stationID;
    }

    public getSummary(): string {
        return `[${this.stationID}] Temp: ${this.temperature.toFixed(1)}°C | Humidity: ${this.humidity}% | Wind: ${this.windSpeed.toFixed(1)} km/h | Precip: ${this.precipitation.toFixed(1)} mm`;
    }
}
