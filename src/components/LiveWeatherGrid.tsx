'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WeatherStation } from '../WeatherStation';
import { calculateAveragePrecipitation, calculateAverageWindSpeed } from '../analysis';

export default function LiveWeatherGrid() {
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [notifications, setNotifications] = useState<{id: string, message: string}[]>([]);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    try {
      if (!db) return; // Prevent crash if firebase config is missing

      const q = query(collection(db, 'sensors'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newStations: WeatherStation[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newStations.push(new WeatherStation(
            data.stationID || doc.id,
            data.temperature || 0,
            data.humidity || 0,
            data.windSpeed || 0,
            data.precipitation || 0
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
        <h2 className="text-3xl font-semibold tracking-tight mb-6 pb-3 border-b border-zinc-800" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Live Sensor Readings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stations.map((station) => (
            <div key={station.stationID} className="glass-card p-6 flex flex-col gap-5">
              {/* Card header */}
              <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-semibold tracking-wider">{station.stationID}</h3>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  Live (Cloud)
                </span>
              </div>

              {/* Stats 2×2 grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Temp', value: `${station.temperature.toFixed(1)}°C` },
                  { label: 'Humidity', value: `${station.humidity.toFixed(0)}%` },
                  { label: 'Wind', value: `${station.windSpeed.toFixed(1)} km/h` },
                  { label: 'Precip', value: `${station.precipitation.toFixed(1)} mm` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-xl font-semibold text-white leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
