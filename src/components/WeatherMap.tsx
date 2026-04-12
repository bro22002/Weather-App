'use client';

import { useEffect, useState, useCallback, useRef, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { firestoreTimestampToDate } from '../lib/firestoreTimestamp';
import { WeatherStation } from '../WeatherStation';

// ── Types ─────────────────────────────────────────────────────────────────────

type ConditionKey = 'All' | 'Sunny/Clear' | 'Hot' | 'Partly Cloudy' | 'Cloudy' | 'Windy' | 'Rainy' | 'Heavy Rain' | 'Snowy';

interface ConditionMeta {
  text: ConditionKey;
  emoji: string;
  color: string;         // marker ring color (tailwind-safe hex)
  bg: string;            // marker background
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCondition(s: WeatherStation): ConditionMeta {
  if (s.precipitation > 5)  return { text: 'Heavy Rain',    emoji: '⛈️',  color: '#3b82f6', bg: '#1e3a5f' };
  if (s.precipitation > 0)  return { text: 'Rainy',         emoji: '🌧️',  color: '#60a5fa', bg: '#1e3a5f' };
  if (s.windSpeed > 30)     return { text: 'Windy',         emoji: '💨',  color: '#a3e635', bg: '#1a2e05' };
  if (s.humidity > 85)      return { text: 'Cloudy',        emoji: '☁️',  color: '#94a3b8', bg: '#1e293b' };
  if (s.temperature > 35)   return { text: 'Hot',           emoji: '🔥',  color: '#f97316', bg: '#431407' };
  if (s.temperature < 0)    return { text: 'Snowy',         emoji: '❄️',  color: '#e0f2fe', bg: '#0c4a6e' };
  if (s.humidity > 60)      return { text: 'Partly Cloudy', emoji: '⛅',  color: '#fbbf24', bg: '#292524' };
  return                           { text: 'Sunny/Clear',   emoji: '☀️',  color: '#facc15', bg: '#292524' };
}

// Dark-mode Google Map style (Aubergine palette)
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',           stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
  { featureType: 'road',  elementType: 'geometry',         stylers: [{ color: '#304a7d' }] },
  { featureType: 'road',  elementType: 'geometry.stroke',  stylers: [{ color: '#255763' }] },
  { featureType: 'road',  elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
  { featureType: 'poi',   elementType: 'geometry',         stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi',   elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
];

const MAP_CENTER = { lat: 20, lng: 10 };
const MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 2,
  minZoom: 2,
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const FILTER_OPTIONS: ConditionKey[] = [
  'All', 'Sunny/Clear', 'Hot', 'Partly Cloudy', 'Cloudy', 'Windy', 'Rainy', 'Heavy Rain', 'Snowy',
];

const FILTER_EMOJIS: Record<ConditionKey, string> = {
  'All': '🌍', 'Sunny/Clear': '☀️', 'Hot': '🔥', 'Partly Cloudy': '⛅',
  'Cloudy': '☁️', 'Windy': '💨', 'Rainy': '🌧️', 'Heavy Rain': '⛈️', 'Snowy': '❄️',
};

// ── Custom Marker (rendered as DOM overlay) ───────────────────────────────────

function StationMarker({
  station,
  condition,
  onSelect,
  isSelected,
}: {
  station: WeatherStation;
  condition: ConditionMeta;
  onSelect: (e: React.MouseEvent) => void;
  isSelected: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).click();
        }
      }}
      title={station.stationID}
      style={{
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        zIndex: isSelected ? 999 : 1,
      }}
    >
      {/* Bubble */}
      <div
        style={{
          background: condition.bg,
          border: `2px solid ${condition.color}`,
          borderRadius: '50%',
          width: isSelected ? '48px' : '40px',
          height: isSelected ? '48px' : '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isSelected ? '22px' : '18px',
          boxShadow: isSelected
            ? `0 0 0 3px ${condition.color}55, 0 4px 20px rgba(0,0,0,0.6)`
            : '0 2px 8px rgba(0,0,0,0.5)',
          transition: 'all 0.15s ease',
        }}
      >
        {condition.emoji}
      </div>
      {/* Label */}
      <div
        style={{
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(4px)',
          color: '#e2e8f0',
          fontSize: '10px',
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          border: `1px solid ${condition.color}55`,
          letterSpacing: '0.03em',
          pointerEvents: 'none',
        }}
      >
        {station.stationID}
      </div>
    </div>
  );
}

// ── Info Popup ────────────────────────────────────────────────────────────────

function InfoPopup({
  station,
  condition,
  onClose,
}: {
  station: WeatherStation;
  condition: ConditionMeta;
  onClose: () => void;
}) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);

  const updatedLabel =
    station.updatedAt != null
      ? `Updated ${station.updatedAt.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
      : null;

  const rows = [
    { label: 'Temperature',  value: `${station.temperature.toFixed(1)}°C` },
    { label: 'Humidity',     value: `${station.humidity.toFixed(0)}%` },
    { label: 'Wind speed',   value: `${station.windSpeed.toFixed(1)} km/h` },
    { label: 'Precipitation',value: `${station.precipitation.toFixed(1)} mm` },
  ];

  return (
    <div
      role="dialog"
      aria-label={`Weather for ${station.stationID}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        transform: 'translate(-50%, calc(-100% - 60px))',
        width: 'max-content',
        maxWidth: 'min(92vw, 280px)',
        boxSizing: 'border-box',
        background: 'rgba(15,23,42,0.96)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${condition.color}55`,
        borderRadius: '12px',
        padding: expanded ? '12px 14px' : '8px 12px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${condition.color}22`,
        color: '#e2e8f0',
        fontSize: '13px',
        fontFamily: "'Inter', sans-serif",
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      {/* Header: toggle strip (no nested buttons) + close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          marginBottom: expanded ? '10px' : '0',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            cursor: 'pointer',
            borderRadius: '8px',
            padding: '4px 6px',
            margin: '-4px -6px',
            outline: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', userSelect: 'none', lineHeight: 1.5 }} aria-hidden>
              {expanded ? '▼' : '▶'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: expanded ? '15px' : '13px',
                  color: '#f1f5f9',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {station.stationID}
              </div>
              <div style={{ color: condition.color, fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>
                {condition.emoji} {condition.text}
                {!expanded && (
                  <span style={{ marginLeft: '8px', color: '#94a3b8', fontWeight: 700 }}>
                    {station.temperature.toFixed(1)}°C
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                {expanded ? 'Click to collapse' : 'Click for full readings'}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '6px',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      <div id={panelId} hidden={!expanded}>
        {/* Data rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, max-content))', gap: '8px' }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 10px' }}>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  marginBottom: '3px',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9', whiteSpace: 'nowrap' }}>{value}</div>
            </div>
          ))}
        </div>

        {updatedLabel && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{updatedLabel}</div>
        )}
      </div>

      {/* Caret pointer */}
      <div style={{
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: `8px solid ${condition.color}55`,
      }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function WeatherMap() {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ConditionKey>('All');
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const deepLinkHandledRef = useRef<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    id: 'google-map-script',
  });

  // ── Live Firestore listener ────────────────────────────────────────
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'sensors'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newStations: WeatherStation[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        newStations.push(new WeatherStation(
          d.stationID || docSnap.id,
          d.temperature    || 0,
          d.humidity       || 0,
          d.windSpeed      || 0,
          d.precipitation  || 0,
          d.latitude,
          d.longitude,
          docSnap.id,
          firestoreTimestampToDate(d.timestamp),
        ));
      });
      setStations(newStations);
    }, (err) => console.error('Firestore error:', err));

    return () => unsubscribe();
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => setMapRef(map), []);

  const mappableStations = stations.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  // Deep link from dashboard cards: /map?station=GH
  useEffect(() => {
    const focusId = searchParams.get('station');
    if (!focusId) {
      deepLinkHandledRef.current = null;
      return;
    }
    if (!mapRef) return;
    const target = mappableStations.find((s) => (s.documentId ?? s.stationID) === focusId);
    if (!target || target.latitude == null || target.longitude == null) return;

    if (deepLinkHandledRef.current === focusId) return;
    deepLinkHandledRef.current = focusId;

    setFilter('All');
    setSelectedId(target.documentId ?? target.stationID);
    mapRef.panTo({ lat: target.latitude, lng: target.longitude });
    const z = mapRef.getZoom() ?? 2;
    if (z < 10) mapRef.setZoom(10);
  }, [searchParams, mapRef, mappableStations]);

  // Apply condition filter
  const visibleStations = filter === 'All'
    ? mappableStations
    : mappableStations.filter((s) => getCondition(s).text === filter);

  const conditionCounts = FILTER_OPTIONS.slice(1).reduce<Record<string, number>>((acc, key) => {
    acc[key] = mappableStations.filter((s) => getCondition(s).text === key).length;
    return acc;
  }, {});

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 gap-3 p-8">
        <span className="text-3xl">⚠️</span>
        <div>
          <p className="font-semibold">Failed to load Google Maps</p>
          <p className="text-sm text-zinc-500 mt-1">Check your API key in <code>.env.local</code></p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-zinc-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading map…</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* ── Filter Toolbar ─────────────────────────────────────────── */}
      <div
        className="absolute top-4 left-1/2 z-10 flex flex-wrap gap-1.5 justify-center"
        style={{ transform: 'translateX(-50%)', maxWidth: '90vw' }}
      >
        {FILTER_OPTIONS.map((key) => {
          const isActive = filter === key;
          const count = key === 'All' ? mappableStations.length : (conditionCounts[key] ?? 0);
          return (
            <button
              key={key}
              id={`filter-${key.toLowerCase().replace(/[^a-z]/g, '-')}`}
              onClick={() => setFilter(key)}
              style={{
                background: isActive ? 'rgba(59,130,246,0.85)' : 'rgba(15,23,42,0.82)',
                backdropFilter: 'blur(8px)',
                border: isActive ? '1px solid #3b82f6' : '1px solid rgba(100,116,139,0.4)',
                borderRadius: '999px',
                color: isActive ? '#fff' : '#cbd5e1',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                letterSpacing: '0.02em',
              }}
            >
              <span>{FILTER_EMOJIS[key]}</span>
              <span>{key}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(100,116,139,0.35)',
                  borderRadius: '999px',
                  padding: '0px 6px',
                  fontSize: '10px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Station count badge ────────────────────────────────────── */}
      <div
        className="absolute bottom-6 left-4 z-10"
        style={{
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(100,116,139,0.35)',
          borderRadius: '10px',
          padding: '8px 14px',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        <span className="text-white font-bold">{visibleStations.length}</span> of{' '}
        <span className="text-white font-bold">{mappableStations.length}</span> stations shown
        {' '}· <span className="text-green-400 font-semibold">● Live</span>
      </div>

      {/* ── Google Map ─────────────────────────────────────────────── */}
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '12px' }}
        center={MAP_CENTER}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
        onClick={() => setSelectedId(null)}
      >
        {visibleStations.map((station) => {
          if (station.latitude == null || station.longitude == null) return null;
          const condition = getCondition(station);
          const mapKey = station.documentId ?? station.stationID;
          const isSelected = selectedId === mapKey;
          const pos = { lat: station.latitude, lng: station.longitude };

          return (
            <div key={mapKey}>
              {/* Marker */}
              <OverlayView mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} position={pos}>
                <StationMarker
                  station={station}
                  condition={condition}
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedId((prev) => (prev === mapKey ? null : mapKey));
                  }}
                  isSelected={isSelected}
                />
              </OverlayView>

              {/* Info popup */}
              {isSelected && (
                <OverlayView mapPaneName={OverlayView.FLOAT_PANE} position={pos}>
                  <InfoPopup
                    station={station}
                    condition={condition}
                    onClose={() => setSelectedId(null)}
                  />
                </OverlayView>
              )}
            </div>
          );
        })}
      </GoogleMap>
    </div>
  );
}
