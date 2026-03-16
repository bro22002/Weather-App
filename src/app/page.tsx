import { fetchSensorData } from '../sensor';
import { calculateAveragePrecipitation, calculateAverageWindSpeed } from '../analysis';
import './globals.css';

export default async function Home() {
  const stations = await fetchSensorData();
  const avgWindSpeed = calculateAverageWindSpeed(stations);
  const avgPrecipitation = calculateAveragePrecipitation(stations);

  // Alerts logic
  const alerts = [];
  if (avgWindSpeed > 20) {
    alerts.push({ type: 'warning', message: 'HIGH WIND WARNING: Average wind speeds are critical.' });
  }
  if (avgPrecipitation > 10) {
    alerts.push({ type: 'danger', message: 'HEAVY RAIN WARNING: Elevated risk of flooding.' });
  }

  return (
    <main className="container">
      <header style={{ marginBottom: '3rem', marginTop: '2rem' }} className="animate-in">
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Real-time <span className="text-blue glow-text">Weather</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Live meteorological sensor data processor
        </p>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 ? (
        <section style={{ marginBottom: '2rem' }} className="animate-in delay-1">
          {alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                padding: '1rem 1.5rem', 
                marginBottom: '1rem',
                borderLeft: `4px solid ${alert.type === 'danger' ? 'var(--accent-red)' : 'var(--accent-yellow)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <p style={{ fontWeight: 500, margin: 0 }}>{alert.message}</p>
            </div>
          ))}
        </section>
      ) : (
        <section style={{ marginBottom: '2rem' }} className="animate-in delay-1">
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderLeft: '4px solid var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <p style={{ fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>No active alerts. Weather is within normal parameters.</p>
          </div>
        </section>
      )}

      {/* Network Overview section */}
      <section className="animate-in delay-2" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>Network Overview</h2>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '250px' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Stations Active</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>{stations.length}</p>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '250px' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Avg Wind Speed</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--accent-blue)' }}>
              {avgWindSpeed.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>km/h</span>
            </p>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', flex: '1', minWidth: '250px' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Avg Precipitation</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--accent-teal)' }}>
              {avgPrecipitation.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>mm</span>
            </p>
          </div>
        </div>
      </section>

      {/* Raw Data Grid */}
      <section className="animate-in delay-3">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>Live Sensor Readings</h2>
        
        <div className="dashboard-grid">
          {stations.map(station => (
            <div key={station.stationID} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem' }}>{station.stationID}</h3>
                <span style={{ cursor: 'pointer', opacity: 0.6 }} title="Live">🟢</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Temp</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{station.temperature.toFixed(1)}°C</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Humidity</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{station.humidity}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Wind</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{station.windSpeed.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>km/h</span></p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Precip</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{station.precipitation.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>mm</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-card)' }}>
        <p>Weather Data Processor Node Network © 2026</p>
      </footer>
    </main>
  );
}
