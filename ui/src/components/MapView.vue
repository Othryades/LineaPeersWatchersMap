<!-- <template>
  <div id="map" style="height: 600px; width: 100%"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

const center = ref([20, 10])
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const nodes = ref([])

function simplifyClientVersion(full) {
  const match = full.match(/([a-zA-Z]+)\/?v?([\d.]+)/)
  return match ? `${match[1]} v${match[2]}` : full
}

function createClientIcon(clientName) {
  const bgColor = {
    Geth: '#fff',
    Besu: '#10b981',
    Erigon: '#3F51B5',
    Nethermind: '#a855f7',
    Unknown: '#6b7280'
  }[clientName] || '#9ca3af'

  const iconUrl = {
    Geth: '/geth.ico',
    Besu: '/besu.svg',
    Erigon: '/erigon.png',
    Nethermind: '/nethermind.png',
    Unknown: '/unknown.png'
  }[clientName] || '/unknown.png'

  return L.divIcon({
    className: '',
    html: `
      <div style="background:${bgColor}; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
        <img src="${iconUrl}" style="width:18px;height:18px;" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

const regionCoords = {
  'us-east-2': { lat: 40.1, lon: -83.2 },
  'us-west-1': { lat: 37.2, lon: -121.8 },
  'eu-north-1': { lat: 59.3, lon: 18.1 },
  'eu-central-1': { lat: 50.1, lon: 8.7 },
  'ap-southeast-1': { lat: 1.35, lon: 103.82 },
  'me-central-1': { lat: 25.28, lon: 55.3 }
}

onMounted(async () => {
  const map = L.map('map').setView(center.value, 2)
  L.tileLayer(tileUrl).addTo(map)
  const markerCluster = L.markerClusterGroup()

  const staticRes = await fetch('http://localhost:3001/static-nodes')
  const staticData = await staticRes.json()
  nodes.value = staticData

  staticData.forEach(node => {
    const client = node.clientName || 'Unknown'
    const versionClean = simplifyClientVersion(node.client)
    const icon = createClientIcon(client)

    const marker = L.marker([node.lat, node.lon], { icon })
    marker
      .bindPopup(`
        <strong>📍 ${node.city}, ${node.country}</strong><br />
        🛠️ ${versionClean}
      `)
      .bindTooltip(versionClean, { direction: 'top' })
    markerCluster.addLayer(marker)
  })

  try {
    const liveRes = await fetch('http://localhost:3001/live-nodes')
    const liveData = await liveRes.json()

    liveData.forEach(node => {
      let lat, lon
      let client = 'Unknown'

      const regionMatch = node.id.match(/(us-east-2|us-west-1|eu-north-1|eu-central-1|ap-southeast-1|me-central-1)/)
      if (regionMatch) {
        const coords = regionCoords[regionMatch[1]]
        lat = coords.lat
        lon = coords.lon
      } else if (node.id.startsWith('linea-geth')) {
        lat = 40.0
        lon = -100.0
      } else if (node.id.startsWith('0x')) {
        lat = 39.0
        lon = -98.0
      } else {
        return
      }

      const versionClean = simplifyClientVersion(node.id)
      const icon = createClientIcon(client)

      const marker = L.marker([lat, lon], { icon })
      marker
        .bindPopup(`
          <strong>🔌 ${node.id}</strong><br />
          💡 Source: ${node.source}
        `)
        .bindTooltip(versionClean, { direction: 'top' })
      markerCluster.addLayer(marker)
    })
  } catch (err) {
    console.error('❌ Failed to fetch live nodes:', err)
  }

  map.addLayer(markerCluster)
})
</script> -->
<template>
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem;">
      <h2 class="text-xl font-bold">🗺️ Linea Node Map</h2>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showHeatmap" /> Heatmap
      </label>
    </div>
    <div id="map" style="height: 600px; width: 100%"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import 'leaflet.heat'

const props = defineProps({
  dark: Boolean,
  filters: Object,
})

const center = ref([20, 10])
const tileUrl = computed(() =>
  props.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
)

const showHeatmap = ref(false)
const heatPoints = []
let map, markerCluster, heatLayer

const regionCoords = {
  'us-east-2': { lat: 40.1, lon: -83.2 },
  'us-west-1': { lat: 37.2, lon: -121.8 },
  'eu-north-1': { lat: 59.3, lon: 18.1 },
  'eu-central-1': { lat: 50.1, lon: 8.7 },
  'ap-southeast-1': { lat: 1.35, lon: 103.82 },
  'me-central-1': { lat: 25.28, lon: 55.3 },
}

function simplifyClientVersion(full) {
  const match = full.match(/([a-zA-Z]+)\/?v?([\d.]+)/)
  return match ? `${match[1]} v${match[2]}` : full
}

function createClientIcon(clientName) {
  const bgColor = {
    Geth: '#fff',
    Besu: '#10b981',
    Erigon: '#3F51B5',
    Nethermind: '#a855f7',
    Unknown: '#6b7280'
  }[clientName] || '#9ca3af'

  const iconUrl = {
    Geth: '/geth.ico',
    Besu: '/besu.svg',
    Erigon: '/erigon.png',
    Nethermind: '/nethermind.png',
    Unknown: '/unknown.png'
  }[clientName] || '/unknown.png'

  return L.divIcon({
    className: '',
    html: `
      <div style="background:${bgColor}; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
        <img src="${iconUrl}" style="width:18px;height:18px;" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

onMounted(async () => {
  map = L.map('map').setView(center.value, 2)
  L.tileLayer(tileUrl.value).addTo(map)
  markerCluster = L.markerClusterGroup()

  const staticRes = await fetch('http://localhost:3001/static-nodes')
  const staticData = await staticRes.json()

  staticData.forEach(node => {
    const client = node.clientName || 'Unknown'
    const versionClean = simplifyClientVersion(node.client)
    const icon = createClientIcon(client)

    const marker = L.marker([node.lat, node.lon], { icon })
    marker
      .bindPopup(`<strong>📍 ${node.city}, ${node.country}</strong><br />🛠️ ${versionClean}`)
      .bindTooltip(versionClean, { direction: 'top' })
    markerCluster.addLayer(marker)
    heatPoints.push([node.lat, node.lon, 0.8])
  })

  try {
    const liveRes = await fetch('http://localhost:3001/live-nodes')
    const liveData = await liveRes.json()

    liveData.forEach(node => {
      let lat, lon
      const client = 'Unknown'

      const regionMatch = node.id.match(/(us-east-2|us-west-1|eu-north-1|eu-central-1|ap-southeast-1|me-central-1)/)
      if (regionMatch) {
        const coords = regionCoords[regionMatch[1]]
        lat = coords.lat
        lon = coords.lon
      } else if (node.id.startsWith('linea-geth')) {
        lat = 40.0
        lon = -100.0
      } else if (node.id.startsWith('0x')) {
        lat = 39.0
        lon = -98.0
      } else {
        return
      }

      const versionClean = simplifyClientVersion(node.id)
      const icon = createClientIcon(client)
      const marker = L.marker([lat, lon], { icon })
      marker
        .bindPopup(`<strong>🔌 ${node.id}</strong><br />💡 Source: ${node.source}`)
        .bindTooltip(versionClean, { direction: 'top' })
      markerCluster.addLayer(marker)
      heatPoints.push([lat, lon, 0.5])
    })
  } catch (err) {
    console.error('❌ Failed to fetch live nodes:', err)
  }

  heatLayer = L.heatLayer(heatPoints, {
    radius: 25,
    blur: 9,
    maxZoom: 8,
    gradient: {
      0.0: '#07e74e00',
      0.4: 'rgba(100, 149, 237, 0.7)',
      0.6: 'rgba(138, 43, 226, 0.8)',
      0.8: 'rgba(255, 0, 255, 0.9)',
      1.0: 'rgba(255, 69, 0, 1.0)'
    }
  })

  map.addLayer(markerCluster)
})

watch(showHeatmap, enabled => {
  if (!map) return
  if (enabled) {
    map.removeLayer(markerCluster)
    map.addLayer(heatLayer)
  } else {
    map.removeLayer(heatLayer)
    map.addLayer(markerCluster)
  }
})

// 🔁 Watch darkMode prop to swap base tiles
watch(() => props.dark, () => {
  if (!map) return
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) map.removeLayer(layer)
  })
  L.tileLayer(tileUrl.value).addTo(map)
  if (showHeatmap.value) map.addLayer(heatLayer)
  else map.addLayer(markerCluster)
})
</script>