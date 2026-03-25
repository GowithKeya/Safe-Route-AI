# Emergency Response & Safe Routing Platform

## 🚀 Project Overview

The **Emergency Response & Safe Routing Platform** is a real-time, AI-powered command center designed for emergency dispatchers, first responders, and fleet managers. It provides a comprehensive, interactive map interface to monitor active emergency vehicles, calculate dynamic ETAs, predict traffic conditions, and route responders safely around hazards.

This application is built to minimize response times, optimize resource allocation, and ensure the safety of both responders and the public during critical incidents.

## ✨ Core Features & Functionality

### 1. Real-Time Fleet Tracking & Dispatch (`src/pages/Dashboard.tsx`)
*   **Live Vehicle Tracking:** Monitors ambulances, fire trucks, and police units in real-time using WebSocket (`socket.io`) connections.
*   **Dynamic ETA Calculation:** Calculates accurate arrival times based on vehicle speed, distance (Haversine formula), and current traffic conditions.
*   **Incident Reporting:** Dispatchers can click directly on the map to report new incidents (e.g., accidents, roadblocks) and instantly dispatch the nearest available unit.
*   **Path History:** Visualizes the recent path of any selected vehicle to analyze routes taken.

### 2. Safe Routing & Hazard Mapping (`src/pages/SafeRoute.tsx`)
*   **Intelligent Routing:** Calculates the fastest or shortest routes while allowing users to avoid tolls and highways.
*   **Hazard Hotspots:** Identifies and displays dangerous zones (e.g., high-crime areas, recent accidents, road closures) with actionable tooltips ("Proceed with caution").
*   **POI Search & Filtering:** Integrates with the Overpass API and Nominatim to search for and display nearby critical facilities (Hospitals, Clinics, Pharmacies, Police Stations).
*   **AI Traffic Prediction:** Overlays predicted traffic congestion levels (Clear, Moderate, Heavy, Severe) to help responders avoid delays.

## 🛠️ Technology Stack

*   **Frontend Framework:** React 18 (Vite)
*   **Styling:** Tailwind CSS
*   **Mapping & GIS:** Leaflet (`react-leaflet`), OpenStreetMap
*   **Real-Time Communication:** Socket.io
*   **Icons:** Lucide React
*   **External APIs:** Overpass API (Facilities), Nominatim (Geocoding/Search)

## 💻 Local Installation Guide

Follow these steps to set up and run the Emergency Response & Safe Routing Platform on your local machine.

### Prerequisites
*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn** package manager
*   **Git** for cloning the repository

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables:**
   * Duplicate the `.env.example` file and rename it to `.env`.
   * Open `.env` and fill in the required API keys (e.g., Gemini API Key, Google Maps API Key).
   * *Note: The application uses `src/apikeys.ts` to manage these keys centrally.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the Application:**
   * Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

## 🔮 Future Enhancements (Roadmap)

While the current platform provides a robust foundation for emergency management, the following features can be added in future iterations:

### Phase 1: Advanced Data Integration
*   **Live Weather Overlays:** Integrate weather APIs (e.g., OpenWeatherMap) to display storms, floods, or extreme conditions that might affect response times.
*   **Wearable Health Data:** Connect to patient wearables (Apple Watch, Fitbit) to transmit real-time vitals to responders en route.
*   **Traffic Camera Feeds:** Embed live CCTV feeds at major intersections directly into the map interface.

### Phase 2: AI & Machine Learning
*   **Predictive Dispatch:** Use historical incident data to predict where emergencies are most likely to occur and pre-position fleet vehicles accordingly.
*   **Automated Triage:** Implement an NLP-based chatbot to automatically categorize and prioritize incoming emergency calls.
*   **Drone Integration:** Add a new vehicle type (`drone`) for rapid aerial reconnaissance of incident scenes before ground units arrive.

### Phase 3: Multi-Agency Collaboration
*   **Cross-Department Communication:** Add a secure, encrypted chat interface for police, fire, and medical teams to coordinate on multi-casualty incidents.
*   **Resource Sharing:** Allow neighboring jurisdictions to view and request mutual aid resources on a unified map.

## 🤝 Contributing

Please refer to `NEV.md` for detailed instructions on project structure, API configuration, and developer navigation.
