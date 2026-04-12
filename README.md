# Overview

As a software engineer, I am building type-safe, real-time systems that combine public weather APIs with a cloud-backed database so multiple UIs—tables and maps—stay in sync without manual refresh. This project extends that idea with **GIS mapping**: the same Firestore documents that power the dashboard also drive **interactive markers** on a world map, which sharpens skills in geospatial UI, batch API design, and client-side state tied to live cloud data.

The software is a **Next.js** application with two main surfaces. The **dashboard** (`/`) lists “sensor” style readings from **Firebase Firestore** (`sensors` collection) via `onSnapshot`, supports add / modify / delete, and shows network-level alerts. The **GIS map** (`/map`) renders stations that have `latitude` and `longitude` using **Google Maps** (`@react-google-maps/api`) with custom overlays: many markers (national capitals when using the bundled ingest list), **click-to-open** detail cards with readings and timestamps, **filters** by derived weather category, and **deep links** (`/map?station=<id>`) so dashboard cards can open the map focused on a station. Ingest uses **Open-Meteo** for current conditions; coordinates and the 195-capital set live in [`src/data/worldCapitals.json`](src/data/worldCapitals.json) and [`src/stationLocations.ts`](src/stationLocations.ts). The browser never needs the service account; optional **`node cloud_sensor.js`** uses **firebase-admin** and Open-Meteo to seed and refresh Firestore (including periodic re-fetch and small simulated jitter).

**How to use the software**

1. Configure Firebase in `.env.local` (`NEXT_PUBLIC_FIREBASE_*` variables per [`src/lib/firebase.ts`](src/lib/firebase.ts)) and add **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** for the map page.  
2. Run `npm install` and `npm run dev`, then open the app (typically `http://localhost:3000`).  
3. Use **`/`** for the live grid, search/add locations, and optional **Insights** on cards; click a card (when coordinates exist) to open **`/map?station=…`** focused on that document.  
4. Use **`/map`** for the full map: filter chips, marker popups (collapsible header for compact view), and live counts from Firestore.  
5. With `serviceAccountKey.json` in the project root (do not commit), run **`node cloud_sensor.js`** to populate or refresh `sensors` from Open-Meteo for the configured capital list.

I wrote this software to practice end-to-end integration—environment configuration, public API ingestion, Firestore as the source of truth, and React clients (grid + map) that react to the same stream of documents—while keeping the domain model (e.g. [`WeatherStation`](src/WeatherStation.ts)) consistent across views.

<!-- [Software Demo Video](http://youtube.link.goes.here) -->

# Development Environment

Development was done primarily in **Visual Studio Code**, using **Node.js** and **npm** for the JavaScript toolchain.

**Programming language and libraries**

- **TypeScript** with **Next.js** (App Router), **React**, and **Tailwind CSS**  
- **Firebase** client SDK for Firestore in the browser; **firebase-admin** for the Node ingest script  
- **@react-google-maps/api** for the GIS map  
- **lucide-react** for navigation icons  
- **Jest** with **ts-jest** for unit tests under `tests/`

External data and services: **Open-Meteo** (forecast and geocoding), **Google Maps JavaScript API** (map tiles and overlays), and **REST Countries** (capital coordinates used to build the committed JSON list).

# Useful Websites

* [Next.js Documentation](https://nextjs.org/docs)
* [Firebase Documentation](https://firebase.google.com/docs)
* [Cloud Firestore](https://firebase.google.com/docs/firestore)
* [Open-Meteo API](https://open-meteo.com/en/docs)
* [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
* [@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)
* [Lucide Icons](https://lucide.dev/)
* [TypeScript Handbook](https://www.typescriptlang.org/docs/)
* [Jest](https://jestjs.io/docs/getting-started)

# Future Work

* Tighten **Firestore security rules** and **Authentication** for production, and document a minimal ruleset for development vs production  
* Add a committed **`.env.example`** (no secrets) and README troubleshooting for missing Firebase or Google Maps env vars  
* **Map UX**: marker clustering at low zoom and optional region filters when the marker count grows  
* **Hardening**: keep `serviceAccountKey.json` out of version control; use Secret Manager or CI-only credentials for automated ingest  
* **Tests**: integration or emulator-based tests for Firestore listeners and map behavior when the collection is empty or errors occur  
* **Features**: charts and historical series, configurable alert thresholds, optional push or email notifications  
* **Performance**: pagination or targeted queries if `sensors` scales beyond full-collection snapshots
