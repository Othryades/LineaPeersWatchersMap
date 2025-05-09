<template>
  <div class="map-view">
    <div id="map" class="map-view__container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, computed, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import 'leaflet.heat'
// import '../style.css'

const HEATMAP_VISIBILITY_MAX_ZOOM = 8
const props = defineProps({
  dark: Boolean,
  filters: Object,
  heatmap: Boolean
})

const center = ref([20, 10])
const tileUrl = computed(() =>
  props.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
)

const showHeatmap = computed(() => props.heatmap)
const heatPoints = []
let map
let staticMarkerCluster, liveMarkerCluster, heatLayer

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

function createClientIcon(clientName, isLive = false) {
  const bgColor = {
    Geth: '#fff',
    Besu: '#d7f8ed',
    Erigon: '#3F51B5',
    Nethermind: '#a855f7',
    Unknown: '#6b7280'
  }[clientName] || '#9ca3af'

  const iconUrl = {
    Geth: '/geth.ico',
    Besu: '/besu.png',
    Erigon: '/erigon.png',
    Nethermind: '/nethermind.png',
    Unknown: '/unknown.png'
  }[clientName] || '/unknown.png'

  return L.divIcon({
    className: 'node-icon',
    html: `
      <div class="node-icon__container" style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        border: 2px solid ${isLive ? '#22c55e' : 'white'};
        overflow: hidden;
      ">
        <img 
          src="${iconUrl}" 
          alt="${clientName}"
          style="
            width: 14px;
            height: 14px;
            object-fit: contain;
          "
        />
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  })
}

// Create custom cluster styles
const createClusterGroup = (color) => {
  return L.markerClusterGroup({
    maxClusterRadius: 40,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount()
      return L.divIcon({
        html: `<div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(30, 30)
      })
    }
  })
}

onMounted(async () => {
  // map = L.map('map').setView(center.value, 2)
  map = L.map('map', { maxZoom: 6 }).setView(center.value, 2)
  L.tileLayer(tileUrl.value).addTo(map)
  
  // Create two separate cluster groups with different colors
  staticMarkerCluster = createClusterGroup('rgb(253 160 52 / 74%)') // Yellow for static
  liveMarkerCluster = createClusterGroup('rgba(34, 197, 94, 0.8)') // Green for live

  // Add marker clusters to map
  map.addLayer(staticMarkerCluster)
  map.addLayer(liveMarkerCluster)

  // Initialize points array for heatmap
  let heatPoints = []

  // Pre-initialize heatLayer but don't add to map yet
  heatLayer = L.heatLayer([], {
    radius: 25,
    blur: 22,
    maxZoom: 8,
    gradient: {
      0.2: '#0ff',
      0.5: '#00f',
      1.0: '#f0f',
    },
  })

  // Track used IPs to prevent duplicates
  const usedIPs = new Set()

  // Initialize client counts
  const clientCounts = {
    Geth: 0,
    Besu: 0,
    Erigon: 0,
    Nethermind: 0,
    Unknown: 0
  }

  // Initialize country counts
  const countryCount = new Map()

  // Load static nodes (once)
  const staticRes = await fetch('http://localhost:3001/static-nodes')
  const staticData = await staticRes.json()
  console.log('Fetched static nodes:', staticData.length, staticData);
  let staticCount = 0
  let skippedStaticDuplicates = 0
  let skippedStaticInvalid = 0

  staticData.forEach(node => {
    // Skip if IP is already used
    if (usedIPs.has(node.ip)) {
      skippedStaticDuplicates++;
      console.log(`Skipping duplicate static node IP: ${node.ip}`)
      return
    }
    if (typeof node.lat !== 'number' || typeof node.lon !== 'number') {
      skippedStaticInvalid++;
      console.log('Skipping node with invalid coordinates:', node);
      return;
    }
    usedIPs.add(node.ip)

    // Get client name from clientName field and capitalize first letter
    const client = node.clientName ? 
      node.clientName.charAt(0).toUpperCase() + node.clientName.slice(1) : 
      'Unknown'
    
    // Increment client count for static nodes
    clientCounts[client] = (clientCounts[client] || 0) + 1

    // Count countries
    if (node.country) {
      countryCount.set(node.country, (countryCount.get(node.country) || 0) + 1)
    }

    const versionClean = simplifyClientVersion(node.client)
    const icon = createClientIcon(client, false)

    const marker = L.marker([node.lat, node.lon], { icon })
    marker
      .bindPopup(`
        <div class="popup">
          <div class="popup__header">
            <span class="popup__icon">📍</span>
            <span class="popup__location">${node.city}, ${node.country}</span>
          </div>
          <div class="popup__content">
            <span class="popup__client">🛠️ ${versionClean}</span>
          </div>
        </div>
      `)
      .bindTooltip(versionClean, { direction: 'top' })
    staticMarkerCluster.addLayer(marker)
    
    // Add to heat points
    heatPoints.push([node.lat, node.lon, 0.8])
    staticCount++
  })
  console.log('Static markers added:', staticCount);
  console.log('Static nodes skipped (duplicates):', skippedStaticDuplicates);
  console.log('Static nodes skipped (invalid coordinates):', skippedStaticInvalid);

  // Function to update live nodes
  const updateLiveNodes = async () => {
    try {
      const liveRes = await fetch('http://localhost:3001/live-nodes')
      const liveData = await liveRes.json()
      console.log('Fetched live nodes:', liveData.length, liveData);
      let liveCount = 0
      let skippedLiveNoId = 0
      let skippedLiveInvalid = 0

      // Keep track of current node IDs to remove stale ones
      const currentNodeIds = new Set()

      // Reset live node client counts while keeping static counts
      const liveClientCounts = {
        Geth: 0,
        Besu: 0,
        Erigon: 0,
        Nethermind: 0,
        Unknown: 0
      }

      // Reset live node country counts while keeping static counts
      const liveCountryCount = new Map()

      // Keep static points and reset live points
      heatPoints = heatPoints.slice(0, staticCount)

      liveData.forEach(node => {
        // For live nodes, use the node ID as the unique identifier
        const nodeId = node.id;
        if (!nodeId) {
          skippedLiveNoId++;
          console.log('[live] Skipping node without ID', node);
          return;
        }

        currentNodeIds.add(nodeId)

        // Skip if this node ID is already used and marker exists
        if (usedIPs.has(nodeId)) {
          // Count existing nodes
          const existingClient = Array.from(liveMarkerCluster.getLayers()).find(
            layer => layer.getTooltip()?.getContent() === simplifyClientVersion(node.id)
          )
          if (existingClient) {
            liveCount++
            // Extract client from existing marker and count it
            const clientMatch = node.id.match(/(besu|geth|erigon|nethermind)/i)
            const client = clientMatch ? clientMatch[1].charAt(0).toUpperCase() + clientMatch[1].slice(1) : 'Unknown'
            liveClientCounts[client]++

            // Count country for existing node
            const popup = existingClient.getPopup()?.getContent()
            if (popup) {
              const countryMatch = popup.match(/span class="popup__location">([^,]+),\s*([^<]+)/)
              if (countryMatch && countryMatch[2]) {
                const country = countryMatch[2].trim()
                liveCountryCount.set(country, (liveCountryCount.get(country) || 0) + 1)
              }
            }
            return
          }
        }

        usedIPs.add(nodeId)

        let lat, lon
        let client = 'Unknown'
        let country = 'Unknown'

        // Detect client type from node ID or clientName
        const nodeClient = node.clientName?.toLowerCase() || ''

        if (nodeId.includes('besu') || nodeClient === 'besu') {
          client = 'Besu'
        } else if (nodeId.includes('geth') || nodeClient === 'geth') {
          client = 'Geth'
        } else if (nodeId.includes('erigon') || nodeClient === 'erigon') {
          client = 'Erigon'
        } else if (nodeId.includes('nethermind') || nodeClient === 'nethermind') {
          client = 'Nethermind'
        }

        // Increment live client count
        liveClientCounts[client]++

        const regionMatch = node.id.match(/(us-east-2|us-west-1|eu-north-1|eu-central-1|ap-southeast-1|me-central-1)/)
        if (regionMatch) {
          const region = regionMatch[1]
          country = region.startsWith('us') ? 'United States' :
                    region.startsWith('eu') ? 'Europe' :
                    region.startsWith('ap') ? 'Singapore' :
                    region.startsWith('me') ? 'UAE' : 'Unknown'
          const coords = regionCoords[region]
          lat = coords.lat
          lon = coords.lon
        } else if (node.id.startsWith('linea-geth')) {
          country = 'United States'
          lat = 40.0
          lon = -100.0
        } else if (node.id.startsWith('0x')) {
          country = 'United States'
          lat = 39.0
          lon = -98.0
        } else {
          country = 'Unknown'
          lat = 39.0
          lon = -98.0
        }

        // Count country
        liveCountryCount.set(country, (liveCountryCount.get(country) || 0) + 1)

        // Check for valid coordinates
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          skippedLiveInvalid++;
          console.log('[live] Skipping node with invalid coordinates:', node);
          return;
        }

        const versionClean = simplifyClientVersion(node.id)
        const icon = createClientIcon(client, true) // true for live nodes
        const marker = L.marker([lat, lon], { icon })
        marker
          .bindPopup(`
            <div class="popup">
              <div class="popup__header">
                <span class="popup__icon">🔌</span>
                <span class="popup__id">${node.id}</span>
              </div>
              <div class="popup__content">
                <span class="popup__source">💡 Source: ${node.source}</span>
                <span class="popup__location">${country}</span>
              </div>
            </div>
          `)
          .bindTooltip(versionClean, { direction: 'top' })
        liveMarkerCluster.addLayer(marker)
        liveCount++

        // Add to heat points
        heatPoints.push([lat, lon, 0.5])
      })

      // Remove stale nodes
      const layers = liveMarkerCluster.getLayers()
      layers.forEach(layer => {
        const tooltipContent = layer.getTooltip()?.getContent()
        if (tooltipContent) {
          // Extract node ID from tooltip content
          const nodeId = tooltipContent.split(' ')[0]
          if (!currentNodeIds.has(nodeId)) {
            liveMarkerCluster.removeLayer(layer)
          }
        }
      })

      // Update heatmap if enabled
      if (showHeatmap.value && map.getZoom() <= HEATMAP_VISIBILITY_MAX_ZOOM) {
        try {
          // Update points on existing heatLayer
          heatLayer.setLatLngs(heatPoints)
          
          // Ensure heatLayer is on map
          if (!map.hasLayer(heatLayer)) {
            map.removeLayer(staticMarkerCluster)
            map.removeLayer(liveMarkerCluster)
            map.addLayer(heatLayer)
          }
        } catch (err) {
          console.warn('Failed to update heatmap, recreating layer:', err)
          // If update fails, recreate the layer
          if (map.hasLayer(heatLayer)) {
            map.removeLayer(heatLayer)
          }
          heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 9,
            maxZoom: 8,
            gradient: {
              0.2: '#0ff',
              0.5: '#00f',
              1.0: '#f0f',
            },
          }).addTo(map)
        }
      }

      // Combine static and live counts
      const totalClientCounts = {
        Geth: clientCounts.Geth + liveClientCounts.Geth,
        Besu: clientCounts.Besu + liveClientCounts.Besu,
        Erigon: clientCounts.Erigon + liveClientCounts.Erigon,
        Nethermind: clientCounts.Nethermind + liveClientCounts.Nethermind,
        Unknown: clientCounts.Unknown + liveClientCounts.Unknown
      }

      // Combine static and live country counts
      const totalCountryCount = new Map()
      for (const [country, count] of countryCount) {
        totalCountryCount.set(country, (totalCountryCount.get(country) || 0) + count)
      }
      for (const [country, count] of liveCountryCount) {
        totalCountryCount.set(country, (totalCountryCount.get(country) || 0) + count)
      }

      // Convert Map to sorted array of objects
      const countryCounts = Array.from(totalCountryCount.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)

      // Update stats with combined counts
      emit('stats-updated', {
        total: staticCount + liveCount,
        live: liveCount,
        static: staticCount,
        clientCounts: totalClientCounts,
        countryCounts: countryCounts
      })

      console.log('Live markers added:', liveCount);
      console.log('Live nodes skipped (no ID):', skippedLiveNoId);
      console.log('Live nodes skipped (invalid coordinates):', skippedLiveInvalid);
      console.log('Total markers (static + live):', staticCount + liveCount);

    } catch (err) {
      console.error('❌ Failed to update live nodes:', err)
    }
  }

  // Initial live nodes load
  await updateLiveNodes()

  // Update live nodes every 5 seconds
  const updateInterval = setInterval(updateLiveNodes, 5000)

  // Cleanup interval and map on component unmount
  onUnmounted(() => {
    clearInterval(updateInterval)
    if (map) {
      map.remove()
    }
  })
})

// Define emits
const emit = defineEmits(['stats-updated'])

// Watch for heatmap toggle
watch(showHeatmap, enabled => {
  if (!map) return

  try {
    if (enabled && map.getZoom() <= HEATMAP_VISIBILITY_MAX_ZOOM) {
      // Remove marker clusters first
      map.removeLayer(staticMarkerCluster)
      map.removeLayer(liveMarkerCluster)

      // Update and add heatLayer
      try {
        heatLayer.setLatLngs(heatPoints)
        if (!map.hasLayer(heatLayer)) {
          map.addLayer(heatLayer)
        }
      } catch (err) {
        console.warn('Failed to update heatmap on toggle, recreating layer:', err)
        // If update fails, recreate the layer
        if (map.hasLayer(heatLayer)) {
          map.removeLayer(heatLayer)
        }
        heatLayer = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 9,
          maxZoom: 8,
          gradient: {
            0.2: '#0ff',
            0.5: '#00f',
            1.0: '#f0f',
          },
        }).addTo(map)
      }
    } else {
      // Switch back to marker clusters
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer)
      }
      map.addLayer(staticMarkerCluster)
      map.addLayer(liveMarkerCluster)
    }
  } catch (err) {
    console.error('Error switching layers:', err)
  }
})

// Update the dark mode handler as well
watch(() => props.dark, () => {
  if (!map || !heatLayer || !staticMarkerCluster || !liveMarkerCluster) return

  try {
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer)
    })
    L.tileLayer(tileUrl.value).addTo(map)
    
    if (showHeatmap.value && map.getZoom() <= HEATMAP_VISIBILITY_MAX_ZOOM) {
      if (map.hasLayer(staticMarkerCluster)) map.removeLayer(staticMarkerCluster)
      if (map.hasLayer(liveMarkerCluster)) map.removeLayer(liveMarkerCluster)
      if (!map.hasLayer(heatLayer)) map.addLayer(heatLayer)
    } else {
      if (map.hasLayer(heatLayer)) map.removeLayer(heatLayer)
      if (!map.hasLayer(staticMarkerCluster)) map.addLayer(staticMarkerCluster)
      if (!map.hasLayer(liveMarkerCluster)) map.addLayer(liveMarkerCluster)
    }
  } catch (err) {
    console.error('Error updating map theme:', err)
  }
})
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  /* border-radius: 12px; */
  overflow: hidden;
  max-width: 100%;
}

.dark .map-view {
  background: #2c2c3c;
}

.map-view__container {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* Override Leaflet's default icon styles */
.leaflet-div-icon {
  background: none !important;
  border: none !important;
}

/* Client icon specific styles */
.node-icon {
  contain: strict;
}

/* Popup Styles */
.popup {
  padding: 0.5rem;
}

.popup__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.popup__icon {
  font-size: 1.2rem;
}

.popup__location,
.popup__id {
  font-weight: 600;
}

.popup__content {
  font-size: 0.9rem;
  color: #6b7280;
}

.dark .popup__content {
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .map-view {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .map-view {
    height: 350px;
  }
  
  .map-view__header {
    padding: 0.5rem 0.75rem;
  }

  .map-view__title {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .map-view {
    height: 300px;
  }
}
</style>