'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreTimestampToDate } from '../lib/firestoreTimestamp';
import { comfortInsight, approximateFeelsLikeC } from '../lib/weatherInsights';
import { WeatherStation } from '../WeatherStation';
import { calculateAveragePrecipitation, calculateAverageWindSpeed } from '../analysis';

function getWeatherCondition(station: WeatherStation) {
  const baseUrl = 'https://www.amcharts.com/wp-content/themes/amcharts4/css/img/icons/weather/animated/';
  if (station.precipitation > 5) return { text: 'Heavy Rain', icon: baseUrl + 'rainy-3.svg' };
  if (station.precipitation > 0) return { text: 'Rainy', icon: baseUrl + 'rainy-1.svg' };
  if (station.windSpeed > 30) return { text: 'Windy', icon: baseUrl + 'cloudy-day-3.svg' };
  if (station.humidity > 85) return { text: 'Cloudy', icon: baseUrl + 'cloudy.svg' };
  if (station.temperature > 30) return { text: 'Hot', icon: baseUrl + 'day.svg' };
  if (station.temperature < 0) return { text: 'Snowy', icon: baseUrl + 'snowy-3.svg' };
  if (station.humidity > 60) return { text: 'Partly Cloudy', icon: baseUrl + 'cloudy-day-1.svg' };
  return { text: 'Sunny/Clear', icon: baseUrl + 'day.svg' };
}

export default function LiveWeatherGrid() {
  const router = useRouter();
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [insightsOpenFor, setInsightsOpenFor] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const openStationOnMap = (station: WeatherStation) => {
    if (station.latitude == null || station.longitude == null) return;
    router.push(`/map?station=${encodeURIComponent(station.idForFirestore)}`);
  };

  useEffect(() => {
    try {
      if (!db) return; // Prevent crash if firebase config is missing

      const q = query(collection(db, 'sensors'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newStations: WeatherStation[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          newStations.push(new WeatherStation(
            data.stationID || docSnap.id,
            data.temperature   || 0,
            data.humidity      || 0,
            data.windSpeed     || 0,
            data.precipitation || 0,
            data.latitude,
            data.longitude,
            docSnap.id,
            firestoreTimestampToDate(data.timestamp),
          ));
        });

        setStations(newStations);

        // Add a notification for updates (skip first load)
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        } else {
          querySnapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const id = Date.now().toString() + Math.random();
              setNotifications(prev => [...prev, { id, message: `${change.doc.data().stationID || change.doc.id} atmospheric data updated!` }]);
              // Auto remove notification after 4 seconds
              setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
              }, 4000);
            }
          });
        }
      }, (error) => {
        console.error("Firestore listening error: ", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase not initialized properly. Did you add the env vars?", err);
    }
  }, []);

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDoc(doc(db, 'sensors', documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleModify = async (documentId: string, currentTemp: number) => {
    try {
      await updateDoc(doc(db, 'sensors', documentId), {
        temperature: currentTemp + (Math.random() * 5 - 2.5),
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error modifying document:", error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      let lat: number, lon: number, name: string;
      
      // Basic check for coordinates: "lat, lon" or "lat,lon"
      const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
         lat = parseFloat(coordMatch[1]);
         lon = parseFloat(coordMatch[3]);
         name = `Station (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
      } else {
        // Use Geocoding API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          alert('Location not found. Try a different city or exact coordinates (lat, lon).');
          setIsSearching(false);
          return;
        }
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        name = geoData.results[0].name;
      }

      // Fetch authentic weather from Open-Meteo
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`);
      const weatherData = await weatherRes.json();
      const current = weatherData.current || {};

      // Insert to Firestore
      await setDoc(doc(db, 'sensors', name), {
        stationID: name,
        temperature: current.temperature_2m || 0,
        humidity: current.relative_humidity_2m || 0,
        windSpeed: current.wind_speed_10m || 0,
        precipitation: current.precipitation || 0,
        latitude: lat,
        longitude: lon,
        timestamp: new Date()
      });

      setSearchQuery('');
    } catch (error) {
      console.error("Error adding location:", error);
      alert('Failed to add location due to an error.');
    } finally {
      setIsSearching(false);
    }
  };

  const avgWindSpeed = calculateAverageWindSpeed(stations);
  const avgPrecipitation = calculateAveragePrecipitation(stations);

  const alerts: { type: 'warning' | 'danger'; message: string }[] = [];
  if (avgWindSpeed > 20) alerts.push({ type: 'warning', message: 'HIGH WIND WARNING: Average wind speeds are critical.' });
  if (avgPrecipitation > 10) alerts.push({ type: 'danger', message: 'HEAVY RAIN WARNING: Elevated risk of flooding.' });

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className="bg-blue-600/90 backdrop-blur-md text-white px-5 py-3 rounded-lg shadow-xl border border-blue-400/30 animate-in slide-in-from-right">
            ☁️ <span className="font-medium">{n.message}</span>
          </div>
        ))}
      </div>

      {stations.length === 0 && (
        <div className="glass-card flex items-center gap-4 px-5 py-8 border-l-4 border-l-yellow-500 mb-10 text-center justify-center">
          <p className="font-medium">Waiting for cloud data.</p>
        </div>
      )}

      {/* ── Alert Banner ─────────────────────────────────────────── */}
      {stations.length > 0 && (
        <section className="mb-10 space-y-3 animate-in delay-100">
          {alerts.length > 0 ? (
            alerts.map((alert, i) => (
              <div
                key={i}
                className={`glass-card flex items-center gap-4 px-5 py-4 border-l-4 ${
                  alert.type === 'danger' ? 'border-l-red-500' : 'border-l-yellow-500'
                }`}
              >
                <span className="text-2xl">⚠️</span>
                <p className="font-medium">{alert.message}</p>
              </div>
            ))
          ) : (
            <div className="glass-card flex items-center gap-4 px-5 py-4 border-l-4 border-l-teal-500">
              <span className="text-2xl">✅</span>
              <p className="font-medium">No active alerts. Weather is within normal parameters.</p>
            </div>
          )}
        </section>
      )}

      {/* ── Network Overview ─────────────────────────────────────── */}
      <section className="mb-14 animate-in delay-200">
        <h2 className="text-3xl font-semibold tracking-tight mb-6 pb-3 border-b border-zinc-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Network Overview
        </h2>
        <div className="flex flex-wrap gap-5">
          {[
            { label: 'Stations Active', value: stations.length, unit: '', color: 'text-white' },
            { label: 'Avg Wind Speed', value: avgWindSpeed.toFixed(1), unit: 'km/h', color: 'text-blue-400' },
            { label: 'Avg Precipitation', value: avgPrecipitation.toFixed(1), unit: 'mm', color: 'text-teal-400' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="glass-card flex-1 min-w-56 px-6 py-5">
              <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
              <p className={`text-4xl font-bold ${color}`}>
                {value}
                {unit && <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Sensor Cards Grid ────────────────────────────────── */}
      <section className="animate-in delay-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 pb-3 border-b border-zinc-800">
          <h2 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Live Sensor Readings
          </h2>
          <form onSubmit={handleAddLocation} className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text"
              placeholder="City (e.g., Paris) or lat,lon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500"
              disabled={isSearching}
            />
            <button 
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 whitespace-nowrap"
            >
              {isSearching ? 'Adding...' : '+ Add Node'}
            </button>
          </form>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stations.map((station) => {
            const condition = getWeatherCondition(station);
            const rowKey = station.documentId ?? station.stationID;
            const hasCoords = station.latitude != null && station.longitude != null;
            const insightsOpen = insightsOpenFor === rowKey;

            return (
            <div
              key={rowKey}
              className="glass-card flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 shadow-lg shadow-black/20 transition hover:border-blue-500/35 hover:shadow-blue-950/20"
            >
              <div
                role="button"
                tabIndex={hasCoords ? 0 : -1}
                className={`flex flex-col gap-5 p-6 text-left outline-none transition ${
                  hasCoords
                    ? 'cursor-pointer hover:bg-zinc-900/50 focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-inset'
                    : 'cursor-default opacity-95'
                }`}
                onClick={() => openStationOnMap(station)}
                onKeyDown={(e) => {
                  if (!hasCoords) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStationOnMap(station);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold tracking-wide text-white truncate">{station.stationID}</h3>
                    <div className="flex items-center gap-2 mt-2 text-zinc-300">
                      <img src={condition.icon} alt={condition.text} className="w-10 h-10 shrink-0 drop-shadow-lg" />
                      <span className="text-sm font-medium">{condition.text}</span>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Temperature', value: `${station.temperature.toFixed(1)}°C` },
                    { label: 'Humidity', value: `${station.humidity.toFixed(0)}%` },
                    { label: 'Wind', value: `${station.windSpeed.toFixed(1)} km/h` },
                    { label: 'Precipitation', value: `${station.precipitation.toFixed(1)} mm` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-zinc-900/50 border border-zinc-800/80 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-zinc-500 tracking-wide mb-0.5">{label}</p>
                      <p className="text-lg font-semibold text-white leading-tight tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>

                {hasCoords ? (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                    <span className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
                      <span aria-hidden>🗺️</span>
                      Open on live map
                    </span>
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">Pan · zoom · popup</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400/90 pt-1 border-t border-zinc-800/60">
                    No map position — this row is dashboard-only until latitude and longitude exist in Firestore.
                  </p>
                )}
              </div>

              {insightsOpen && (
                <div className="mx-4 mb-2 rounded-xl border border-zinc-700/80 bg-zinc-950/70 px-4 py-3 text-sm text-zinc-300">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Insights</p>
                  <p className="leading-relaxed">{comfortInsight(station)}</p>
                  <p className="mt-2 text-xs text-zinc-500 tabular-nums">
                    Approx. feels-like {approximateFeelsLikeC(station).toFixed(1)}°C (simple model, not official METAR)
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 px-4 py-3 bg-zinc-950/30">
                <button
                  type="button"
                  className="text-xs font-medium rounded-lg bg-violet-950/50 hover:bg-violet-900/60 text-violet-200 px-2.5 py-1.5 border border-violet-700/40 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInsightsOpenFor((id) => (id === rowKey ? null : rowKey));
                  }}
                >
                  {insightsOpen ? 'Hide insights' : 'Insights'}
                </button>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleModify(station.idForFirestore, station.temperature);
                    }}
                    className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 px-2.5 py-1 rounded transition-colors"
                  >
                    Modify
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(station.idForFirestore);
                    }}
                    className="text-xs bg-red-900/40 hover:bg-red-800/60 text-red-300 px-2.5 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </section>
    </>
  );
}
