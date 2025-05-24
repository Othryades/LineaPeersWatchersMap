import { ref, computed, onUnmounted } from 'vue'
import L from 'leaflet'
import { MAP_CONFIG, HEATMAP_CONFIG } from '../utils/constants'

/**
 * Composable for managing map state and operations
 * @param {Object} props - Component props
 * @returns {Object} Map instance and operations
 */
export function useMap(props) {
  const mapInstance = ref(null)
  const staticMarkerCluster = ref(null)
  const heatLayer = ref(null)
  const heatPoints = ref([])

  const tileUrl = computed(() =>
    props.dark ? MAP_CONFIG.tileUrls.dark : MAP_CONFIG.tileUrls.light
  )

  const createClusterGroup = (color) => {
    return L.markerClusterGroup({
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

  const initializeMap = () => {
    mapInstance.value = L.map('map', { maxZoom: MAP_CONFIG.maxZoom })
      .setView(MAP_CONFIG.center, 2)
    
    L.tileLayer(tileUrl.value).addTo(mapInstance.value)
    
    // Initialize clusters
    staticMarkerCluster.value = createClusterGroup('rgb(104 66 202 / 74%)')
    
    // Add static cluster to map
    mapInstance.value.addLayer(staticMarkerCluster.value)
    
    // Initialize heat layer
    heatLayer.value = L.heatLayer([], {
      ...HEATMAP_CONFIG,
      gradient: HEATMAP_CONFIG.gradient
    })
  }

  const updateMapTheme = () => {
    if (!mapInstance.value) return

    try {
      mapInstance.value.eachLayer(layer => {
        if (layer instanceof L.TileLayer) mapInstance.value.removeLayer(layer)
      })
      L.tileLayer(tileUrl.value).addTo(mapInstance.value)
    } catch (err) {
      console.error('Error updating map theme:', err)
    }
  }

  const toggleHeatmap = (enabled) => {
    if (!mapInstance.value) return

    try {
      if (enabled && mapInstance.value.getZoom() <= MAP_CONFIG.heatmapMaxZoom) {
        if (staticMarkerCluster.value && mapInstance.value.hasLayer(staticMarkerCluster.value)) {
          mapInstance.value.removeLayer(staticMarkerCluster.value)
        }
        if (heatLayer.value) {
          try {
            heatLayer.value.setLatLngs(heatPoints.value)
            if (!mapInstance.value.hasLayer(heatLayer.value)) {
              mapInstance.value.addLayer(heatLayer.value)
            }
          } catch (err) {
            // fallback: recreate the layer
            heatLayer.value = L.heatLayer(heatPoints.value, {
              ...HEATMAP_CONFIG,
              gradient: HEATMAP_CONFIG.gradient
            }).addTo(mapInstance.value)
          }
        }
      } else {
        if (heatLayer.value && mapInstance.value.hasLayer(heatLayer.value)) {
          mapInstance.value.removeLayer(heatLayer.value)
        }
        if (staticMarkerCluster.value && !mapInstance.value.hasLayer(staticMarkerCluster.value)) {
          mapInstance.value.addLayer(staticMarkerCluster.value)
        }
      }
    } catch (err) {
      console.error('Error switching layers:', err)
    }
  }

  const cleanup = () => {
    if (mapInstance.value) {
      mapInstance.value.remove()
    }
  }

  onUnmounted(cleanup)

  return {
    mapInstance,
    staticMarkerCluster,
    heatLayer,
    heatPoints,
    initializeMap,
    updateMapTheme,
    toggleHeatmap
  }
} 