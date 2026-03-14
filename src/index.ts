/**
 * Weather Data Processor — Entry point
 *
 * Pulls live readings from our sensor network, runs basic stats,
 * and prints human-readable summaries plus any safety alerts.
 * Run this to get a quick snapshot of conditions across all stations.
 */

import { fetchSensorData } from './sensor';
import { calculateAverageWindSpeed, calculateAveragePrecipitation } from './analysis';

async function main() {
    console.log('=============================================');
    console.log('         WEATHER DATA PROCESSOR V1.0         ');
    console.log('=============================================');
    console.log('\nFetching real-time data from remote sensors...');
    
    try {
        const stations = await fetchSensorData();
        
        console.log('\n[✔] Data retrieved successfully!\n');
        console.log('----------------- RAW DATA ------------------');
        
        // One line per station: temp, humidity, wind, precipitation
        stations.forEach(station => {
            console.log(station.getSummary());
        });
        
        console.log('\n--------------- DATA ANALYSIS ---------------');
        
        // Calculate averages using recursive functions
        const avgWindSpeed = calculateAverageWindSpeed(stations);
        const avgPrecipitation = calculateAveragePrecipitation(stations);
        
        console.log(`➜ Total Stations Analysed: ${stations.length}`);
        console.log(`➜ Average Wind Speed:      ${avgWindSpeed.toFixed(2)} km/h`);
        console.log(`➜ Average Precipitation:   ${avgPrecipitation.toFixed(2)} mm`);
        
        // Generate alerts based on averages
        console.log('\n------------------ ALERTS -------------------');
        let unalerted = true;
        
        if (avgWindSpeed > 20) {
            console.log('⚠️  HIGH WIND WARNING: Average wind speeds are critical.');
            unalerted = false;
        }
        if (avgPrecipitation > 10) {
            console.log('⚠️  HEAVY RAIN WARNING: Elevated risk of flooding.');
            unalerted = false;
        }
        
        if (unalerted) {
            console.log('✅  No active alerts. Weather is within normal parameters.');
        }

        console.log('\n=============================================');
        
    } catch (error) {
        console.error('❌ Failed to retrieve weather data:', error);
    }
}

// Execute the main function
main();
