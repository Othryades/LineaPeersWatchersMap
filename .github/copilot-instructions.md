# Copilot Instructions for LineaPeersWatchersMap

## Project Architecture

- **Frontend (`ui/`)**: Vue 3 (Composition API, `<script setup>`) with Vite. Main features are interactive map (Leaflet), node clustering (leaflet.markercluster), heatmap (leaflet.heat), and charts (Chart.js via vue-chartjs). Key files: `src/components/MapView.vue`, `src/components/ClientStatsCharts.vue`, `src/views/Dashboard.vue`, `src/composables/useMap.js`, `src/composables/useNodes.js`.
- **Backend (`backend/`)**: Node.js + Express. Handles API endpoints and real-time data via WebSocket (Primus) to `ethstats.linea.build`. Key files: `index.js` (entry), `liveNodesState.js` (WebSocket logic), `controllers/`, `routes/`, `data/` (static/enriched node data).

## Data Flow

- **Static Nodes**: Periodically enriched from network, stored in `backend/data/peers_enriched.json`, served via `/static-nodes` endpoint.
- **Live Nodes**: Real-time updates from WebSocket, managed in `liveNodesState.js`, served via `/live-nodes` endpoint.
- **Frontend**: Fetches both static and live node data from backend, displays on map and charts.

## Developer Workflows

- **Backend**: Start with `node index.js` (or `npm run dev` if available). Dependencies in `backend/package.json`.
- **Frontend**: Start with `npm run dev` in `ui/`. Vite serves at `http://localhost:5173`. Dependencies in `ui/package.json`.
- **Data Update**: Static peer enrichment logic in `enrich-peers.js`. Temporary/intermediate data in `datatmp/`.

## Conventions & Patterns

- **Vue**: Use `<script setup>` and Composition API. Shared logic in `src/composables/`. Components are single-file Vue components.
- **Backend**: API routes in `routes/`, controllers in `controllers/`. Data files in `data/` (static) and `datatmp/` (intermediate).
- **Map Logic**: All map rendering and interaction logic is in `MapView.vue` and `useMap.js`.
- **Node Data**: Node fetching, enrichment, and geolocation logic is in backend, with frontend consuming via REST endpoints.

## Integration Points

- **WebSocket**: Backend connects to `wss://ethstats.linea.build/primus` for live node data.
- **Leaflet**: Frontend uses Leaflet and plugins for map visualization.
- **Chart.js**: Used for node statistics charts.

## External Dependencies

- **Frontend**: Vue 3, Vite, Leaflet, leaflet.markercluster, leaflet.heat, vue-chartjs, Axios.
- **Backend**: Express, Primus, CORS.

## Examples

- To add a new map feature, update `MapView.vue` and/or `useMap.js`.
- To enrich static node data, modify `enrich-peers.js` and update `data/peers_enriched.json`.
- To expose new backend data, add a route in `routes/`, a controller in `controllers/`, and update `index.js`.

---

If any section is unclear or missing, please provide feedback for further refinement.