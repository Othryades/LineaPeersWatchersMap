export const MAP_CONFIG = {
  center: [20, 10],
  maxZoom: 6,
  heatmapMaxZoom: 8,
  tileUrls: {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  }
}

export const CLIENT_CONFIG = {
  colors: {
    Geth: '#fff',
    Besu: '#d7f8ed',
    Erigon: '#3F51B5',
    Nethermind: '#a855f7',
    Unknown: '#6b7280'
  },
  icons: {
    Geth: '/geth.ico',
    Besu: '/besu.png',
    Erigon: '/erigon.png',
    Nethermind: '/nethermind.png',
    Unknown: '/unknown.png'
  }
}

export const HEATMAP_CONFIG = {
  radius: 15,
  blur: 12,
  maxZoom: 8,
  gradient: {
    0.1: 'lime',
    0.3: 'cyan',
    0.5: 'lime',
    0.7: 'yellow',
    0.9: 'orange',
    1.0: 'red'
    // 0.2: '#0ff',
    // 0.5: '#00f',
    // 1.0: '#f0f',
  }
}

// Frontend-only mode: load static data from a JSON file served by Vite/public.
// You can still override the base via VITE_API_BASE_URL if you host the JSON elsewhere.
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '')

export const API_ENDPOINTS = {
  // Default (current view)
  staticNodes: `${API_BASE_URL}/peers_erigon_merged.json`,
  // Alternative snapshot (previous enrichment)
  staticNodesAlt: `${API_BASE_URL}/peers_new.json`,
  // List of available static sources
  staticNodeSources: [
    { key: 'erigon', url: `${API_BASE_URL}/peers_erigon_new.json` },
    // { key: 'primary', url: `${API_BASE_URL}/peers_new.json` }
  ]
}