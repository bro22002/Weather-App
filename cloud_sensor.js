const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'serviceAccountKey.json');
const STATION_LOCATIONS = require('./src/data/worldCapitals.json');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
/** Keep URLs within practical limits; must match `OPEN_METEO_BATCH_SIZE` in `src/sensor.ts`. */
const OPEN_METEO_BATCH_SIZE = 80;
/** Re-fetch live conditions from Open-Meteo on this interval (ms). */
const OPEN_METEO_REFETCH_MS = 30 * 60 * 1000;

/**
 * Fetches real weather data for all stations from Open-Meteo in batched requests.
 */
async function fetchRealSensorData() {
    const combined = [];
    for (let offset = 0; offset < STATION_LOCATIONS.length; offset += OPEN_METEO_BATCH_SIZE) {
        const chunk = STATION_LOCATIONS.slice(offset, offset + OPEN_METEO_BATCH_SIZE);
        const latitudes = chunk.map((s) => s.latitude).join(',');
        const longitudes = chunk.map((s) => s.longitude).join(',');
        const params = new URLSearchParams({
            latitude: latitudes,
            longitude: longitudes,
            current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
            temperature_unit: 'celsius',
            wind_speed_unit: 'kmh',
            precipitation_unit: 'mm',
        });

        const url = `${OPEN_METEO_BASE}?${params.toString()}`;
        console.log(`\nFetching Open-Meteo chunk ${offset / OPEN_METEO_BATCH_SIZE + 1}…`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const body = await response.json();

        const items = Array.isArray(body) ? body : [body];
        if (items.length !== chunk.length) {
            throw new Error(`Expected ${chunk.length} results, got ${items.length}`);
        }

        chunk.forEach((loc, i) => {
            const c = items[i].current || {};
            combined.push({
                docId: loc.docId,
                stationID: loc.stationID,
                latitude: loc.latitude,
                longitude: loc.longitude,
                temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : 0,
                humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : 0,
                windSpeed: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : 0,
                precipitation: typeof c.precipitation === 'number' ? c.precipitation : 0,
            });
        });
    }
    return combined;
}

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
        console.error(`Error: ${SERVICE_ACCOUNT_FILE} not found!`);
        return;
    }

    const serviceAccount = require(SERVICE_ACCOUNT_FILE);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();

    async function pushToFirebase(stationData) {
        const { docId, ...payload } = stationData;
        const docRef = db.collection('sensors').doc(docId);
        await docRef.set({
            ...payload,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[Cloud Sync] ${docId} — ${stationData.stationID}`);
    }

    let baselineData = [];
    try {
        baselineData = await fetchRealSensorData();
    } catch (e) {
        console.error('Failed to fetch Open-Meteo data:', e);
        return;
    }

    console.log(`Uploading Open-Meteo data for ${baselineData.length} capital stations…`);
    for (const data of baselineData) {
        await pushToFirebase(data);
    }

    setInterval(async () => {
        try {
            baselineData = await fetchRealSensorData();
            for (const data of baselineData) {
                await pushToFirebase(data);
            }
            console.log(`[Open-Meteo] Full refresh completed (${baselineData.length} stations)`);
        } catch (e) {
            console.error('[Open-Meteo] Scheduled refetch failed:', e);
        }
    }, OPEN_METEO_REFETCH_MS);

    console.log('\n--- Live Hardware Simulation Mode Active ---');
    console.log('Minor random fluctuations every 5s (one random station per tick).');
    console.log(`Full Open-Meteo re-fetch every ${OPEN_METEO_REFETCH_MS / 60000} minutes.`);
    console.log('Press Ctrl+C to exit.');

    setInterval(() => {
        const randomStation = baselineData[Math.floor(Math.random() * baselineData.length)];

        const liveData = {
            ...randomStation,
            temperature: randomStation.temperature + (Math.random() * 0.6 - 0.3),
            windSpeed: Math.max(0, randomStation.windSpeed + (Math.random() * 2 - 1)),
            humidity: Math.max(0, Math.min(100, randomStation.humidity + (Math.random() * 2 - 1))),
        };

        pushToFirebase(liveData).catch(console.error);
    }, 5000);
}

main().catch(console.error);
