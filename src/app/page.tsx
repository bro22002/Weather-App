import LiveWeatherGrid from '../components/LiveWeatherGrid';

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-14">

      {/* ── Hero Header ──────────────────────────────────────────── */}
      <header className="mb-12 animate-in">
        <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Real-time{' '}
          <span className="text-blue-400 drop-shadow-lg">Weather</span>
        </h1>
        <p className="text-zinc-400 text-lg">Cloud-synced meteorological sensor data processor</p>
      </header>

      <LiveWeatherGrid />

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="mt-20 pt-6 border-t border-zinc-800 text-center text-zinc-600 text-sm">
        <p>Weather Data Processor Node Network © 2026 | Powered by Firebase</p>
      </footer>
    </main>
  );
}
