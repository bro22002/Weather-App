# Overview

<!-- learning goals as a software engineer (do not frame as a school assignment) -->
As a software engineer, I am focused on building type-safe, responsive systems that combine public weather APIs with cloud-backed state so the UI can stay in sync without manual refreshes. This project is a hands-on exploration of real-time data: how to ingest sensor-style readings, persist them in a managed database, and reflect changes instantly in a React front end.

<!-- software description, cloud database integration, how to use the program -->
The Weather App is a **Next.js** dashboard that shows live meteorological readings per station. The browser connects to **Google Firebase Firestore** with the Firebase Web SDK (`onSnapshot` on the `sensors` collection), so any create, update, or delete in the cloud appears on the page immediately—including toast notifications when a station’s document changes. Readings can originate from **Open-Meteo** (used by the optional `cloud_sensor.js` ingest script and when you add a location from the UI). Station coordinates used elsewhere in the codebase are defined in `src/stationLocations.ts`.

**How to use the program**

1. **Firebase setup**  
   Create a Firebase project, enable **Firestore**, and add a **Web app** to get the client config. Create a `.env.local` in the project root with: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` (see `src/lib/firebase.ts`). For the Node ingest script, download a **service account** JSON from Firebase Console → Project settings → Service accounts and place it as `serviceAccountKey.json` in the repo root (do not commit this file).

2. **Run the web app**  
   Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open the local URL shown in the terminal (typically `http://localhost:3000`). You need a network connection for Firebase and for Open-Meteo when adding locations.

3. **Populate or simulate cloud data**  
   With `serviceAccountKey.json` present, run:

   ```bash
   node cloud_sensor.js
   ```

   This fetches current conditions from Open-Meteo for configured stations, writes each station as a document in Firestore (`sensors` collection), then periodically applies small random fluctuations and writes updates so the dashboard’s live listener fires. Alternatively, `python_service/cloud_sensor.py` demonstrates Firestore CRUD and continuous updates using the Python Admin SDK (place the same service account key in `python_service/` as documented in that script).

4. **Use the dashboard**  
   The **Live Sensor Readings** grid shows documents from Firestore. Use **+ Add Node** to search by city or enter `latitude, longitude`; the app geocodes (if needed), fetches Open-Meteo, and **creates** a new `sensors` document. **Modify** and **Delete** update or remove documents in Firestore. Network-level alerts (e.g. average wind and precipitation) are computed in the UI from the current station list.

<!-- purpose for writing this software -->
I wrote this software to practice end-to-end integration: environment-based configuration, a real-time NoSQL store, and a client that treats the database as the source of truth for “sensor” data while still layering analysis and alerts on top.

<!-- 4–5 minute demo — app running, code walkthrough, cloud database view -->
<!-- [Software Demo Video](http://youtube.link.goes.here) -->

# Cloud Database

<!-- which cloud database you are using -->
The cloud database is **Firebase Firestore**, a managed document database that scales automatically and supports real-time listeners from web clients.

<!-- structure of the database you created -->
The app uses a single top-level collection, **`sensors`**. Each document’s ID is typically the station identifier (for example a place name or code). Each document stores:

- `stationID` — human-readable station name or ID  
- `temperature`, `humidity`, `windSpeed`, `precipitation` — numeric readings  
- `timestamp` — server or client time when the row was written (ingest scripts and the UI set this when updating)

The Next.js app reads the whole collection and maps each document into `WeatherStation` objects for averages and alerts. Writes are performed from the browser (add / modify / delete) and from **firebase-admin** in `cloud_sensor.js` (and optionally the Python service), using a service account for server-side access.

# Development Environment

<!--  tools used to develop the software -->
Development was done primarily in **Visual Studio Code**, using **Node.js** and **npm** for the JavaScript toolchain.

<!-- programming language and libraries -->
**Languages and libraries**

- **TypeScript** with **Next.js** (App Router), **React**, and **Tailwind CSS** for the UI  
- **Firebase** (`firebase` client SDK for Firestore in the browser; `firebase-admin` for the Node ingest script)  
- **Jest** with **ts-jest** for unit tests (e.g. analysis and domain logic under `tests/`)

External data: **Open-Meteo** forecast API and Open-Meteo geocoding for the “add location” flow.

# Useful Websites

<!-- helpful websites (name + URL) -->
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest](https://jestjs.io/docs/getting-started)

# Future Work

<!-- fix, improve, and add — bullet list -->
- Tighten **Firestore security rules** and **Authentication** so only trusted clients or backends can write to `sensors`, and document a minimal ruleset for development vs production  
- Add a committed **`.env.example`** (without secrets) and README troubleshooting for missing Firebase env vars and common listener errors  
- Align **ingest scripts** with a single station list (or shared config) so `cloud_sensor.js`, `stationLocations.ts`, and optional Python demos do not drift  
- **Hardening**: ensure `serviceAccountKey.json` is never committed; consider Secret Manager or CI-only credentials for automated ingest  
- **Tests**: integration or emulator-based tests for Firestore paths and UI behavior when the collection is empty or errors occur  
- **Features**: charts and historical series (may require a different data model or retention policy), configurable alert thresholds, and optional push or email notifications  
- **Performance**: pagination or query limits if the station count grows large; revisit full-collection snapshots for scalability
