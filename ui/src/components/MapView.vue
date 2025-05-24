<template>
  <div class="map-view">
    <div id="map" class="map-view__container"></div>
  </div>
</template>

<script setup>
import { onMounted, watch, onUnmounted, ref, computed } from 'vue'
import { useMap } from '../composables/useMap'
import { useNodes } from '../composables/useNodes'
import { createNodePopup } from '../utils/helpers'
import { HEATMAP_CONFIG } from '../utils/constants'
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
let map

const regionCoords = {
  'us-east-2': { lat: 40.1, lon: -83.2 },
  'us-west-1': { lat: 37.2, lon: -121.8 },
  'eu-north-1': { lat: 59.3, lon: 18.1 },
  'eu-central-1': { lat: 50.1, lon: 8.7 },
  'ap-southeast-1': { lat: 1.35, lon: 103.82 },
  'me-central-1': { lat: 25.28, lon: 55.3 },
}

// Create custom cluster styles
const createClusterGroup = (color) => {
  return L.markerClusterGroup({
    // maxClusterRadius: 0.5,
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

const emit = defineEmits(['stats-updated'])

// Initialize composables
const {
  mapInstance,
  staticMarkerCluster,
  heatLayer,
  heatPoints,
  initializeMap,
  updateMapTheme,
  toggleHeatmap
} = useMap(props)

const {
  nodes,
  stats,
  loading,
  error,
  fetchStaticNodes
} = useNodes()

// Watch for stats updates
watch(stats, (newStats) => {
  emit('stats-updated', newStats)
}, { deep: true })

// Watch for heatmap toggle
watch(() => props.heatmap, (enabled) => {
  toggleHeatmap(enabled)
})

// Watch for dark mode changes
watch(() => props.dark, () => {
  updateMapTheme()
})

onMounted(async () => {
  // Initialize map
  initializeMap()

  // Fetch and process static nodes
  const staticNodes = await fetchStaticNodes()
  
  const JITTER_FACTOR = .5; // Increased from 0.05

  // Create a map to count nodes per exact coordinate for jittering
  const coordCounts = new Map();
  staticNodes.forEach(node => {
    const key = `${node.lat},${node.lon}`;
    coordCounts.set(key, (coordCounts.get(key) || 0) + 1);
  });

  // Add static nodes to map
  staticNodes.forEach(node => {
    const marker = L.marker([node.lat, node.lon], { icon: node.icon })
    marker
      .bindPopup(createNodePopup(node))
      .bindTooltip(node.client, { direction: 'top' })
    staticMarkerCluster.value.addLayer(marker)
    
    let heatLat = node.lat;
    let heatLon = node.lon;
    const coordKey = `${node.lat},${node.lon}`;

    // Apply jitter if multiple nodes share this exact coordinate
    if (coordCounts.get(coordKey) > 1) {
      heatLat += (Math.random() - 0.5) * JITTER_FACTOR;
      heatLon += (Math.random() - 0.5) * JITTER_FACTOR;
    }
    
    // Add to heat points using potentially jittered coordinates
    heatPoints.value.push([heatLat, heatLon, 1.0]);
  })

  // --- FIX: If heatmap is enabled and we have points, trigger the watcher logic ---
  if (props.heatmap && heatPoints.value.length > 0) {
    // Manually trigger the heatmap watcher logic
    if (mapInstance.value && heatLayer.value) {
      try {
        heatLayer.value.setLatLngs(heatPoints.value)
        if (!mapInstance.value.hasLayer(heatLayer.value)) {
          mapInstance.value.addLayer(heatLayer.value)
        }
        if (staticMarkerCluster.value && mapInstance.value.hasLayer(staticMarkerCluster.value)) {
          mapInstance.value.removeLayer(staticMarkerCluster.value)
        }
      } catch (err) {
        // fallback: recreate the layer
        heatLayer.value = L.heatLayer(heatPoints.value, HEATMAP_CONFIG).addTo(mapInstance.value)
      }
    }
  }
})

// Watch for heatmap toggle
watch(showHeatmap, enabled => {
  if (!mapInstance.value) return;
  if (!heatPoints.value || heatPoints.value.length === 0) return;

  try {
    if (enabled && mapInstance.value.getZoom() <= HEATMAP_VISIBILITY_MAX_ZOOM) {
      // Remove marker clusters first
      if (staticMarkerCluster.value) mapInstance.value.removeLayer(staticMarkerCluster.value)

      // Update and add heatLayer
      try {
        if (heatLayer.value) {
          heatLayer.value.setLatLngs(heatPoints.value)
          if (!mapInstance.value.hasLayer(heatLayer.value)) {
            mapInstance.value.addLayer(heatLayer.value)
          }
        }
      } catch (err) {
        console.warn('Failed to update heatmap on toggle, recreating layer:', err)
        // If update fails, recreate the layer
        if (heatLayer.value && mapInstance.value.hasLayer(heatLayer.value)) {
          mapInstance.value.removeLayer(heatLayer.value)
        }
        heatLayer.value = L.heatLayer(heatPoints.value, HEATMAP_CONFIG).addTo(mapInstance.value)
      }
    } else {
      // Switch back to marker clusters
      if (heatLayer.value && mapInstance.value.hasLayer(heatLayer.value)) {
        mapInstance.value.removeLayer(heatLayer.value)
      }
      if (staticMarkerCluster.value) mapInstance.value.addLayer(staticMarkerCluster.value)
    }
  } catch (err) {
    console.error('Error switching layers:', err)
  }
})

// Update the dark mode handler as well
watch(() => props.dark, () => {
  if (!mapInstance.value || !heatLayer.value || !staticMarkerCluster.value) return

  try {
    mapInstance.value.eachLayer(layer => {
      if (layer instanceof L.TileLayer) mapInstance.value.removeLayer(layer)
    })
    L.tileLayer(tileUrl.value).addTo(mapInstance.value)
    
    // --- FIX: Always re-add the correct data layers after theme change ---
    if (showHeatmap.value && heatPoints.value && heatPoints.value.length > 0 && mapInstance.value.getZoom() <= HEATMAP_VISIBILITY_MAX_ZOOM) {
      if (staticMarkerCluster.value && mapInstance.value.hasLayer(staticMarkerCluster.value)) mapInstance.value.removeLayer(staticMarkerCluster.value)
      if (heatLayer.value) {
        heatLayer.value.setLatLngs(heatPoints.value)
        if (!mapInstance.value.hasLayer(heatLayer.value)) mapInstance.value.addLayer(heatLayer.value)
      }
    } else {
      if (heatLayer.value && mapInstance.value.hasLayer(heatLayer.value)) mapInstance.value.removeLayer(heatLayer.value)
      if (staticMarkerCluster.value && !mapInstance.value.hasLayer(staticMarkerCluster.value)) mapInstance.value.addLayer(staticMarkerCluster.value)
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