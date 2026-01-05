# Linea Mainnet Peers Watcher Map

**Live Application:** [https://lineapeerswatchersmap.netlify.app/](https://lineapeerswatchersmap.netlify.app/)

## Project Overview

This project provides a dynamic visualization of Linea mainnet peer nodes distributed across the globe. It features an interactive map displaying node locations, client types, and network statistics. The app now runs frontend-only (Vue 3 + Vite); data is loaded from enriched JSON snapshots placed in `ui/public`.

## Key Features

* **Interactive Map:** Displays Linea peer nodes on a world map (Leaflet).
* **Node Information:** Client type and geo (from IP enrichment).
* **Data Layers:** Marker clusters + heatmap.
* **Network Statistics:** Totals, client distribution, country distribution.
* **Static Data:** Served from `ui/public/*.json` (no backend required).
* **Theme:** Dark/light toggle.

## Tech Stack

**Frontend (UI):**
* **Framework:** Vue 3 (Composition API with `<script setup>`)
* **Build Tool:** Vite
* **Mapping:** Leaflet.js, `leaflet.markercluster`, `leaflet.heat`
* **Charts:** Chart.js (via `vue-chartjs`)
* **Styling:** CSS + Tailwind v4 imports

**Data prep (CLI):**
* Node.js scripts to enrich raw `admin_peers` snapshots into JSON used by the UI.

## Data Flow / Enrichment

1) Get raw peers from your node (`admin_peers` RPC) or `admin_nodeInfo` for a single node.
2) Run the enrichment script to normalize and geo-tag:
   * Script: `backend/process-peers.js`
   * Usage: `node backend/process-peers.js <input_raw.json> <output_enriched.json>`
   * Steps: filter private IPs, dedupe by enode, parse client name/version, batch geolocate via `ip-api.com`, emit `ip, client, clientName, clientVersion, enode, country, region, city, lat, lon`.
3) Optional: merge multiple enriched files (e.g., Besu + Erigon) into one combined snapshot placed in `ui/public/`.
4) The UI loads the chosen JSON from `ui/public` (see `ui/src/utils/constants.js` for endpoints).

Live WebSocket data from `ethstats.linea.build` is currently not required for the hosted build; the map runs from static snapshots.

## Setup and Running Locally

### Prerequisites

*   Node.js (version 18.x or later recommended)
*   npm (usually comes with Node.js)

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
