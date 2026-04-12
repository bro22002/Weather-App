'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// WeatherMap uses browser-only APIs (google.maps, DOM overlays).
// Disable SSR to prevent Next.js server-render errors.
const WeatherMap = dynamic(() => import('../../components/WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full gap-3 text-zinc-400">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span>Loading map…</span>
    </div>
  ),
});

export default function MapPage() {
  return (
    <main className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800 shrink-0">
        <span className="text-2xl">🗺️</span>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            GIS Weather <span className="text-blue-400">Station Map</span>
          </h1>
          <p className="text-zinc-500 text-sm">
            Live atmospheric data at national capitals worldwide (Open-Meteo via Firestore)
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Cloud Synced
        </div>
      </header>

      {/* ── Map Container ───────────────────────────────────────────── */}
      <div className="flex-1 p-4 min-h-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full gap-3 text-zinc-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading map…</span>
            </div>
          }
        >
          <WeatherMap />
        </Suspense>
      </div>

    </main>
  );
}
