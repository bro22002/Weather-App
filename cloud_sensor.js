const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'serviceAccountKey.json');

// Exact coordinates from src/stationLocations.ts
const STATION_LOCATIONS = [
    { stationID: 'Cape Coast', latitude: 5.1053, longitude: -1.2466 }, 
    { stationID: 'Accra', latitude: 5.6052, longitude: -0.1668}, 
    // { stationID: 'Kumasi', latitude: 6.6885, longitude: -1.6244 }, 
];

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches real weather data exactly like src/sensor.ts
 */
async function fetchRealSensorData() {
    const latitudes = STATION_LOCATIONS.map((s) => s.latitude).join(',');
    const longitudes = STATION_LOCATIONS.map((s) => s.longitude).join(',');
    const params = new URLSearchParams({
        latitude: latitudes,
        longitude: longitudes,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        precipitation_unit: 'mm',
    });
    
    const url = `${OPEN_METEO_BASE}?${params.toString()}`;
    console.log(`\nFetching real baseline data from Open-Meteo...`);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const body = await response.json();
    
    const items = Array.isArray(body) ? body : [body];
    return STATION_LOCATIONS.map((loc, i) => {
        const c = items[i].current || {};
        return {
            stationID: loc.stationID,
            temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : 0,
            humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : 0,
            windSpeed: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : 0,
            precipitation: typeof c.precipitation === 'number' ? c.precipitation : 0
        };
    });
}

async function main() {
    if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
        console.error(`Error: ${SERVICE_ACCOUNT_FILE} not found!`);
        return;
    }

    const serviceAccount = require(SERVICE_ACCOUNT_FILE);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    async function pushToFirebase(stationData) {
        const docRef = db.collection('sensors').doc(stationData.stationID);
        await docRef.set({
            ...stationData,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[Cloud Sync] Updated station ${stationData.stationID}`);
    }

    // 1. Fetch real baseline data once
    let baselineData = [];
    try {
        baselineData = await fetchRealSensorData();
    } catch (e) {
        console.error("Failed to fetch Open-Meteo data:", e);
        return;
    }

    // 2. Upload the real authentic data to Firebase
    console.log("Uploading authentic Open-Meteo data to Firebase...");
    for (const data of baselineData) {
        await pushToFirebase(data);
    }

    console.log("\n--- Live Hardware Simulation Mode Active ---");
    console.log("We are now adding minor organic fluctuations to the real data every 5 seconds.");
    console.log("(This simulates real-time hardware sensor variance without spamming the Open-Meteo API)");
    console.log("Press Ctrl+C to exit.");

    // 3. To maintain our real-time UI notification requirement, we occasionally 
    // perturb the baseline data slightly to simulate wind/temp fluctuations.
    setInterval(() => {
        const randomStation = baselineData[Math.floor(Math.random() * baselineData.length)];
        
        // Add tiny hardware sensor noise
        const liveData = {
            ...randomStation,
            // Vary temp by +/- 0.3
            temperature: randomStation.temperature + (Math.random() * 0.6 - 0.3), 
            // Vary wind by +/- 1.0
            windSpeed: Math.max(0, randomStation.windSpeed + (Math.random() * 2 - 1)), 
            // Vary humidity by +/- 1
            humidity: Math.max(0, Math.min(100, randomStation.humidity + (Math.random() * 2 - 1))) 
        };
        
        pushToFirebase(liveData).catch(console.error);
    }, 5000);
}

main().catch(console.error);
