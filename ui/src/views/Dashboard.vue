<template>
  <div :class="['dashboard', isDark ? 'dark' : 'light']">
    <header class="dashboard__header">
      <div class="theme-toggle" @click="isDark = !isDark">
        {{ isDark ? '🌙' : '☀️' }}
      </div>
      <h1 class="dashboard__title">Linea Mainnet Peers Watcher Map</h1>
      <div class="placeholder"></div>
    </header>

    <div class="dashboard__content">
      <aside class="dashboard__sidebar">
        <div class="stats-card">
          <h2 class="stats-card__title">Network</h2>
          <div class="stats-card__content">
            <div class="stat-item">
              <span class="stat-item__icon"></span>
              <span class="stat-item__label">Total Peers</span>
              <span class="stat-item__value">{{ stats.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item__icon"></span>
              <span class="stat-item__label">
                Live Nodes
                <div class="tooltip-container">
                  <span class="info-icon">i</span>
                  <div class="tooltip">Shows nodes that voluntarily share data to ethstats.linea, refreshed every 5 sec.</div>
                </div>
              </span>
              <span class="stat-item__value">{{ stats.live }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item__icon"></span>
              <span class="stat-item__label">
                Static Nodes
                <div class="tooltip-container">
                  <span class="info-icon">i</span>
                  <div class="tooltip">Static nodes are a list of admin_peers from a random node on the network, that may or may not be currently active, refreshed every week.</div>
                </div>
              </span>
              <span class="stat-item__value">{{ stats.static }}</span>
            </div>
          </div>
        </div>

        <div class="filters-card">
          <h2 class="filters-card__title">Stats</h2>
          <div class="filters-card__content">
            <div class="filter-group">
              <label class="filter-group__label">Client Type</label>
              <div class="client-filters">
                <div 
                  v-for="client in clients" 
                  :key="client"
                  :class="['client-filter', selectedClient === client ? 'active' : '']"
                >
                  {{ client }}
                  <span class="client-count" v-if="stats.clientCounts[client]">
                    ({{ stats.clientCounts[client] }})
                  </span>
                </div>
              </div>
            </div>
            <div class="filter-group">
              <label class="filter-group__label">Location</label>
              <div class="client-filters">
                <div 
                  v-for="country in stats.countryCounts" 
                  :key="country.country"
                  :class="['client-filter', locationFilter === country.country ? 'active' : '']"
                  @click="locationFilter = locationFilter === country.country ? '' : country.country"
                >
                  {{ country.country }}
                  <span class="client-count">
                    ({{ country.count }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="dashboard__main">
        <div class="map-header">
          <h2 class="map-header__title">Node Distribution</h2>
          <button 
            class="map-header__toggle"
            @click="isHeatmapEnabled = !isHeatmapEnabled"
          >
            Heatmap
          </button>
        </div>
        <div class="map-container">
          <MapView 
            :filters="{ client: selectedClient, location: locationFilter }" 
            :dark="isDark"
            :heatmap="isHeatmapEnabled"
            @stats-updated="updateStats" 
          />
        </div>
      </main>
    </div>

    <footer class="dashboard__footer">
      <div class="footer__content">
        <div class="footer__info">
          <span>Linea Peers Watcher Map</span>
          <span class="footer__separator">•</span>
          <span>v.0.1</span>
        </div>
        <div class="footer__links">
          <a href="https://linea.build" target="_blank" rel="noopener">Linea</a>
          <span class="footer__separator">•</span>
          <a href="https://docs.linea.build/developers/guides/run-a-node" target="_blank" rel="noopener">Run a node!</a>
          <span class="footer__separator">•</span>
          <a href="https://github.com/Othryades/lineanodemap" target="_blank" rel="noopener">GitHub</a>
          <span class="footer__separator">•</span>
          <a href="https://vite.dev/" target="_blank" rel="noopener"><img src="/vite.svg?url" alt="Linea Logo" style="width: 13px; height: 14px;"></a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import MapView from '../components/MapView.vue'
// import '../style.css'
const isDark = ref(true)
const selectedClient = ref('')
const locationFilter = ref('')
const stats = ref({ 
  total: 0, 
  live: 0, 
  static: 0, 
  clientCounts: {},
  countryCounts: []
})
const isHeatmapEnabled = ref(true)

const clients = ['Geth', 'Besu', 'Erigon', 'Nethermind', 'Unknown']

// Watch for dark mode changes and update body class
watch(isDark, (newValue) => {
  if (newValue) {
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
})

function updateStats(newStats) {
  stats.value = newStats
}
</script>

<style>
/* Global styles - outside scoped */
body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f9fafb;
  transition: background-color 0.3s ease;
}

body.dark {
  background: #1e1e2f;
}
</style>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  transition: all 0.3s ease;
}

.dashboard.light {
  color: #1f2937;
}

.dashboard.dark {
  color: #e5e7eb;
}

.dashboard__header {
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: white;
  color: black;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .dashboard__header {
  background: #1e1e2f;
  color: white;
}

.dashboard__title {
  text-align: center;
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  transition: all 0.2s ease;
}

.dark .theme-toggle {
  background: #334155;
}

.theme-toggle:hover {
  background: #e2e8f0;
}

.dark .theme-toggle:hover {
  background: #475569;
}

.theme-toggle__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.placeholder {
  width: 40px;
}

.dashboard__content {
  display: grid;
  grid-template-columns: 400px minmax(600px, 800px);
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 64px - 200px);
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
}

.dashboard__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard__main {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  height: 530px;
  display: flex;
  flex-direction: column;
}

.dark .dashboard__main {
  background: #2c2c3c;
}

/* Stats Card */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.dark .stats-card {
  background: #2c2c3c;
}

.stats-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.stats-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.dark .stat-item {
  background: #374151;
}

.stat-item__icon {
  font-size: 1.2rem;
}

.stat-item__label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dark .stat-item__label {
  color: #9ca3af;
}

.stat-item__value {
  font-weight: 600;
}

/* Filters Card */
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.dark .filters-card {
  background: #2c2c3c;
}

.filters-card__title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.filters-card__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group__label {
  font-size: 0.9rem;
  color: #6b7280;
}

.dark .filter-group__label {
  color: #9ca3af;
}

.client-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

/* Add a custom scrollbar for the country list */
.client-filters::-webkit-scrollbar {
  width: 4px;
}

.client-filters::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dark .client-filters::-webkit-scrollbar-track {
  background: #374151;
}

.client-filters::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.dark .client-filters::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.client-filters::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.dark .client-filters::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.client-filter {
  background: none;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  /* cursor: pointer; */
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark .client-filter {
  color: #9ca3af;
}

.client-filter:hover {
  background: #f3f4f6;
  color: #374151;
}

.dark .client-filter:hover {
  background: #374151;
  color: #e5e7eb;
}

.client-filter.active {
  background: #e2e8f0;
  color: #1f2937;
  font-weight: 500;
}

.dark .client-filter.active {
  background: #334155;
  color: #f8fafc;
}

.client-count {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  min-width: 1.5rem;
  text-align: center;
}

.dark .client-count {
  background: #374151;
  color: #9ca3af;
}

.client-filter.active .client-count {
  background: #e2e8f0;
  color: #1f2937;
}

.dark .client-filter.active .client-count {
  background: #334155;
  color: #f8fafc;
}

.filter-group__input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.dark .filter-group__input {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}

.filter-group__input:focus {
  outline: none;
  border-color: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.1);
}

.dark .filter-group__input:focus {
  border-color: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.1);
}

.filter-group__select {
  display: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard__content {
    grid-template-columns: 350px minmax(400px, 600px);
    height: calc(100vh - 64px - 150px);
  }

  .dashboard__main {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .dashboard__content {
    grid-template-columns: 1fr;
    max-width: 100%;
    height: auto;
    gap: 1.5rem;
  }

  .dashboard__sidebar {
    order: 2;
  }

  .dashboard__main {
    order: 1;
    height: 350px;
  }

  .stats-card__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .dashboard__header {
    padding: 0.625rem 1rem;
    grid-template-columns: 60px 1fr 60px;
  }

  .theme-toggle {
    width: 36px;
    height: 36px;
  }

  .theme-toggle__icon {
    font-size: 1.125rem;
  }

  .placeholder {
    width: 36px;
  }

  .map-header {
    padding: 0.5rem 0.75rem;
  }

  .map-header__title {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .dashboard__header {
    padding: 1rem;
  }

  .dashboard__title {
    font-size: 1.2rem;
  }

  .stats-card__content {
    grid-template-columns: 1fr;
  }

  .dashboard__main {
    height: 300px;
  }
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dark .map-header {
  background: #1e293b;
  border-color: #334155;
}

.map-header__title {
  font-size: 1rem;
  font-weight: 500;
  color: #475569;
  margin: 0;
}

.dark .map-header__title {
  color: #e2e8f0;
}

.map-header__toggle {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border: none;
  border-radius: 6px;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark .map-header__toggle {
  background: #1e293b;
  color: #94a3b8;
}

.map-container {
  flex: 1;
  min-height: 0;
}

.dashboard__footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  margin-top: auto;
}

.dark .dashboard__footer {
  background: #1e1e2f;
  border-color: #334155;
}

.footer__content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
}

.dark .footer__content {
  color: #94a3b8;
}

.footer__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__links a {
  color: #64748b;
  text-decoration: none;
  transition: color 0.2s ease;
}

.dark .footer__links a {
  color: #94a3b8;
}

.footer__links a:hover {
  color: #0ea5e9;
}

.footer__separator {
  color: #94a3b8;
  opacity: 0.5;
}

@media (max-width: 640px) {
  .footer__content {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}

/* Add these new styles at the end of your existing styles */
.tooltip-container {
  position: relative;
  display: inline-block;
}

.info-icon {
  cursor: help;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 11px;
  margin-left: 4px;
  background: #64748b;
  color: white;
  border-radius: 50%;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  font-style: italic;
  font-family: serif;
}

.dark .info-icon {
  background: #94a3b8;
}

.info-icon:hover {
  opacity: 1;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 100%;
  margin-bottom: 5px;
  padding: 6px 10px;
  background: #2c2c3c;
  color: white;
  font-size: 0.75rem;
  white-space: normal;
  max-width: 240px;
  min-width: 180px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 100;
  opacity: 0;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  text-align: center;
  pointer-events: none;
}

.tooltip::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -4px;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: #2c2c3c;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.dark .tooltip {
  background: #1e1e2f;
  color: #e5e7eb;
}

.dark .tooltip::before {
  background: #1e1e2f;
}
</style>
  