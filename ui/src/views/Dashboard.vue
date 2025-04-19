<template>
    <div :class="['page-wrapper', isDark ? 'dark' : 'light']">
      <header class="header">
        <div class="title">🌍 Linea Node Map</div>
        <div class="actions">
          <label>
            <input type="checkbox" v-model="isDark" /> 🌗
          </label>
        </div>
      </header>
  
      <section class="stats-bar">
        <div>🧮 Total Peers: {{ stats.total }}</div>
        <div>📡 Live Nodes: {{ stats.live }}</div>
        <div>🪪 Static Nodes: {{ stats.static }}</div>
      </section>
  
      <section class="filters">
        <select v-model="selectedClient">
          <option value="">All Clients</option>
          <option v-for="client in clients" :key="client">{{ client }}</option>
        </select>
        <input type="text" v-model="locationFilter" placeholder="Filter by city or country" />
      </section>
  
      <main class="map-container">
        <MapView :filters="{ client: selectedClient, location: locationFilter }" :dark="isDark" @stats-updated="updateStats" />
      </main>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import MapView from '../components/MapView.vue'
  
  const isDark = ref(false)
  const selectedClient = ref('')
  const locationFilter = ref('')
  const stats = ref({ total: 0, live: 0, static: 0 })
  
  const clients = ['Geth', 'Besu', 'Erigon', 'Nethermind', 'Unknown']
  
  function updateStats(newStats) {
    stats.value = newStats
  }
  </script>
  
  <style scoped>
  .page-wrapper {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Inter', sans-serif;
    transition: background 0.3s;
  }
  
  .page-wrapper.light {
    background: #f9fafb;
    color: #1f2937;
  }
  
  .page-wrapper.dark {
    background: #1e1e2f;
    color: #e5e7eb;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #111827;
    color: white;
    padding: 1rem 2rem;
    font-size: 1.4rem;
    font-weight: bold;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .stats-bar {
    display: flex;
    justify-content: space-around;
    padding: 1rem;
    background: #e5e7eb;
    font-weight: 500;
  }
  
  .page-wrapper.dark .stats-bar {
    background: #2c2c3c;
    color: #d1d5db;
  }
  
  .filters {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 1.5rem;
    background: transparent;
  }
  
  .filters select,
  .filters input {
    padding: 0.4rem 0.6rem;
    font-size: 1rem;
    border-radius: 8px;
    border: 1px solid #ccc;
  }
  
  .map-container {
    flex-grow: 1;
    margin: 1rem;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
  
  .page-wrapper.dark .map-container {
    background: #2c2c3c;
  }
  </style>
  