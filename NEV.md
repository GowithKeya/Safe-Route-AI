# Developer Navigation & Setup Guide (NEV.md)

Welcome to the developer onboarding guide. This document contains the folder structure, navigation flow, and instructions on where to configure APIs and environment variables for the Emergency Response & Safe Routing Platform.

## 📁 Folder Structure

```text
/
├── public/                 # Static assets (favicon, etc.)
├── src/
│   ├── components/         # Reusable UI components (Buttons, Modals, Cards)
│   ├── pages/              # Main application pages
│   │   ├── Dashboard.tsx   # Main dispatch and fleet tracking dashboard
│   │   └── SafeRoute.tsx   # Safe routing, hazard mapping, and POI search
│   ├── App.tsx             # Main application router and layout wrapper
│   ├── main.tsx            # React entry point
│   └── index.css           # Global Tailwind CSS styles
├── .env.example            # Example environment variables file
├── package.json            # Project dependencies and scripts
├── vite.config.ts          # Vite bundler configuration
└── README.md               # Project overview
```

## 🔑 API Keys & Environment Variables

To run this project locally or in production, you need to configure your environment variables. 

1. Create a `.env` file in the root directory (duplicate `.env.example`).
2. Add the following keys where applicable:

```env
# --- API KEYS ---
# If integrating Google Maps or Mapbox in the future, place keys here:
VITE_MAPS_API_KEY=your_api_key_here

# --- BACKEND / SOCKETS ---
# URL for the real-time Socket.io server (Fleet tracking)
VITE_SOCKET_URL=http://localhost:3000

# --- EXTERNAL SERVICES ---
# Currently, the app uses free open-source APIs (Overpass API, Nominatim) 
# which do not require keys. If rate-limited, you may need to add premium endpoints here.
VITE_OVERPASS_API_URL=https://overpass-api.de/api/interpreter
VITE_NOMINATIM_API_URL=https://nominatim.openstreetmap.org/search
```

*Note: Never commit your actual `.env` file to version control.*

## 🧭 Application Navigation & Data Flow

### 1. Dashboard (`src/pages/Dashboard.tsx`)
*   **Purpose:** Central command center for dispatchers.
*   **Key State:** `fleet` (vehicles), `accidents` (incidents), `facilities` (hospitals, police).
*   **Data Flow:** Uses `socket.io` to listen to `vehicleLocationUpdate` and `fleetUpdate` events. Dispatches vehicles to incident coordinates and calculates dynamic ETAs using the Haversine formula.

### 2. Safe Routing (`src/pages/SafeRoute.tsx`)
*   **Purpose:** For drivers and responders to find the safest path to a destination.
*   **Key State:** `route` (polyline coordinates), `safetyStats` (hazards), `facilities` (nearby POIs).
*   **Data Flow:** Fetches route data based on origin/destination. Uses Overpass API to fetch nearby medical and police facilities. Displays hazard hotspots with tooltips.

## 🛠️ How to Add New Features

1. **Adding a new Page:** Create a new `.tsx` file in `src/pages/`, then add the route in `src/App.tsx` using `react-router-dom`.
2. **Adding a new Map Layer:** Modify the `MapContainer` inside `Dashboard.tsx` or `SafeRoute.tsx`. Use `react-leaflet` components like `<Marker>`, `<Polyline>`, or `<CircleMarker>`.
3. **Adding a new API Integration:** Create a new service file in `src/services/` (e.g., `src/services/weatherApi.ts`) to keep component files clean, then import the fetch functions into your `useEffect` hooks.
