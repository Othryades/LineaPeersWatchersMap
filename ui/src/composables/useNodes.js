import { ref, computed } from 'vue'
import { API_ENDPOINTS } from '../utils/constants'
import { createClientIcon } from '../utils/helpers'

/**
 * Composable for managing node data and operations
 * @returns {Object} Node state and operations
 */
export function useNodes() {
  const nodes = ref([])
  const clientCounts = ref({
    Geth: 0,
    Besu: 0,
    Erigon: 0,
    Nethermind: 0,
    Unknown: 0
  })
  const countryCount = ref(new Map())
  const loading = ref(false)
  const error = ref(null)

  const stats = computed(() => ({
    total: nodes.value.length,
    clientCounts: clientCounts.value,
    countryCounts: Array.from(countryCount.value.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
  }))

  const resetCounts = () => {
    clientCounts.value = {
      Geth: 0,
      Besu: 0,
      Erigon: 0,
      Nethermind: 0,
      Unknown: 0
    }
    countryCount.value.clear()
  }

  const processNode = (node) => {
    if (typeof node.lat !== 'number' || typeof node.lon !== 'number') {
      console.warn('Skipping node with invalid coordinates:', node)
      return null
    }

    const client = node.clientName ? 
      node.clientName.charAt(0).toUpperCase() + node.clientName.slice(1) : 
      'Unknown'

    // Update counts
    clientCounts.value[client] = (clientCounts.value[client] || 0) + 1
    if (node.country) {
      countryCount.value.set(
        node.country, 
        (countryCount.value.get(node.country) || 0) + 1
      )
    }

    return {
      ...node,
      client,
      icon: createClientIcon(client, false)
    }
  }

  const fetchStaticNodes = async () => {
    loading.value = true
    error.value = null
    resetCounts()

    try {
      const res = await fetch(API_ENDPOINTS.staticNodes)
      const data = await res.json()
      
      const usedIPs = new Set()
      const processedNodes = []

      data.forEach(node => {
        if (usedIPs.has(node.ip)) {
          console.log(`Skipping duplicate static node IP: ${node.ip}`)
          return
        }
        usedIPs.add(node.ip)

        const processedNode = processNode(node)
        if (processedNode) {
          processedNodes.push(processedNode)
        }
      })

      nodes.value = processedNodes
      return processedNodes
    } catch (err) {
      error.value = err
      console.error('Failed to fetch static nodes:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    nodes,
    stats,
    loading,
    error,
    fetchStaticNodes
  }
} 