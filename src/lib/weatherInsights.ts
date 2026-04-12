import type { WeatherStation } from '../WeatherStation';

/** Simple apparent-temperature style feel (°C) — illustrative, not METAR-grade. */
export function approximateFeelsLikeC(station: WeatherStation): number {
    const { temperature: t, humidity: rh, windSpeed: wKmh } = station;
    const v = wKmh / 3.6;
    const e = 6.105 * Math.exp((17.27 * t) / (237.7 + t));
    const at = t + 0.33 * (rh / 100) * e - 0.7 * v - 4;
    return Number.isFinite(at) ? Math.round(at * 10) / 10 : t;
}

export function comfortInsight(station: WeatherStation): string {
    const feels = approximateFeelsLikeC(station);
    if (station.precipitation > 3) return 'Wet pattern — watch local flood guidance.';
    if (station.windSpeed > 40) return 'Strong wind — secure loose items outdoors.';
    if (feels > 35) return 'Feels very hot — limit exertion and hydrate.';
    if (feels > 28) return 'Warm and muggy — take breaks in shade or AC.';
    if (station.temperature < 5) return 'Cold air — bundle up; wind increases chill.';
    if (station.humidity > 85) return 'Very humid — evaporation cooling is limited.';
    return 'Conditions look comfortable for most activities.';
}
