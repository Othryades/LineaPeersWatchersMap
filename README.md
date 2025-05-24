# Linea Mainnet Peers Watcher Map

**Live Application:** [https://lineapeerswatchersmap.netlify.app/](https://lineapeerswatchersmap.netlify.app/)

## Project Overview

This project provides a dynamic, real-time visualization of Linea mainnet peer nodes distributed across the globe. It features an interactive map displaying node locations, client types, and network statistics. The frontend is built with Vue 3 and Vite, utilizing Leaflet for map rendering, while the backend is a Node.js application using Express.

## Key Features

*   **Interactive Map:** Displays Linea peer nodes on a world map.
*   **Node Information:** Provides details on individual nodes, including client type and location (derived from IP geolocation and AWS region heuristics).
*   **Data Layers:**
    *   **Marker Clusters:** Groups nearby nodes for better visibility at wider zoom levels.
    *   **Heatmap:** Visualizes areas with high node density.
*   **Network Statistics:**
    *   Total count of static peers.
    *   Distribution of nodes by client type (e.g., Geth, Besu, Erigon, Nethermind).
    *   Distribution of nodes by country.
*   **Real-time Updates:** Live node data is sourced from `ethstats.linea.build` via WebSocket.
*   **Static Peer Data:** Enriched static peer list is updated periodically.
*   **Dark/Light Mode:** User-selectable theme for the dashboard.

## Tech Stack

**Frontend (UI):**
*   **Framework:** Vue 3 (Composition API with `<script setup>`)
*   **Build Tool:** Vite
*   **Mapping:**
    *   Leaflet.js
    *   `leaflet.markercluster` (for clustering nodes)
    *   `leaflet.heat` (for heatmap display)
*   **Charting:** Chart.js (via `vue-chartjs`)
*   **HTTP Client:** Axios
*   **Styling:** Primarily custom CSS with global `box-sizing` and responsive design.

**Backend:**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **WebSocket Client:** Primus (to connect to `ethstats.linea.build`)
*   **Middleware:** CORS

## Data Sources

*   **Static Nodes:** Fetched from the backend API endpoint `/static-nodes`. This data is typically an enriched list of `admin_peers` from a random node on the network, refreshed periodically. Geolocation is derived from IP addresses and AWS region heuristics.
*   **Live Nodes:** Sourced in real-time via a WebSocket connection to `wss://ethstats.linea.build/primus`.

## Setup and Running Locally

### Prerequisites

*   Node.js (version 18.x or later recommended)
*   npm (usually comes with Node.js)

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server (defaults to `http://localhost:3000` or as per your config):
    ```bash
    node index.js
    # or if you have a dev script: npm run dev
    ```

### Frontend (UI)

1.  Navigate to the `ui` directory:
    ```bash
    cd ui
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server (usually on `http://localhost:5173`):
    ```bash
    npm run dev
    ```
4.  Open your browser to the address provided by Vite.

## Project Structure (Simplified)

```
lineanodemap/
├── backend/
│   ├── controllers/    # Request handlers
│   ├── data/           # Static data files (e.g., enriched_static_nodes.json)
│   ├── routes/         # API route definitions
│   ├── config/         # Configuration files
│   ├── index.js        # Backend server entry point
│   └── liveNodesState.js # Manages WebSocket connection and live node data
│   └── package.json
└── ui/
    ├── public/         # Static assets
    ├── src/
    │   ├── assets/     # CSS, images
    │   ├── components/ # Vue components (MapView, charts, etc.)
    │   ├── composables/ # Reusable Vue Composition API functions (useMap, useNodes)
    │   ├── views/      # Main page views (Dashboard.vue)
    │   ├── utils/      # Utility functions, constants
    │   ├── App.vue     # Root Vue component
    │   └── main.js     # Frontend entry point
    ├── index.html
    └── package.json
└── README.md
```

*(This README was enhanced with the help of an AI assistant.)*

# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
