<template>
  <h1 class="visually-hidden">Linea nodes and peers map</h1>
  <div :class="['dashboard', isDark ? 'dark' : 'light']">
    <!-- Status Bar -->
    <header class="status-bar">
      <div class="status-bar__left">
        <span :class="['status-dot', statusDotClass]"></span>
        <h1 class="status-bar__title">Linea Network</h1>
      </div>
      <div class="status-bar__right">
        <span class="status-bar__info">
          {{ stats.total }} peers • {{ countryCount }} countries
        </span>
      </div>
    </header>

    <!-- Hero Map Section -->
    <section class="map-hero">
      <MapView
        :filters="{ client: selectedClient, location: locationFilter }"
        :dark="isDark"
        :heatmap="isHeatmapEnabled"
        @stats-updated="updateStats"
      />
      
      <!-- Floating Stats Overlay -->
      <div class="stats-overlay">
        <div class="stats-overlay__item stats-overlay__item--primary">
          <span class="stats-overlay__value">{{ displayTotal }}</span>
          <span class="stats-overlay__label">Total Peers</span>
        </div>
        <div class="stats-overlay__divider"></div>
        <div class="stats-overlay__item">
          <span class="stats-overlay__value">{{ displayCountries }}</span>
          <span class="stats-overlay__label">Countries</span>
        </div>
        <div class="stats-overlay__divider"></div>
        <div class="stats-overlay__item">
          <span class="stats-overlay__value">{{ displayClients }}</span>
          <span class="stats-overlay__label">Clients</span>
        </div>
        <div class="stats-overlay__divider"></div>
        <div class="stats-overlay__item stats-overlay__item--tps">
          <span :class="['stats-overlay__value', 'stats-overlay__value--tps', { 'stats-overlay__value--flash': tpsFlash }]">
            {{ tps.toFixed(1) }}
          </span>
          <span class="stats-overlay__label">TPS</span>
        </div>
      </div>

      <!-- Map Controls -->
      <div class="map-controls">
        <button 
          class="map-controls__btn" 
          :class="{ 'map-controls__btn--active': isHeatmapEnabled }"
          @click="isHeatmapEnabled = !isHeatmapEnabled"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <span>Heatmap</span>
        </button>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-section__container">
        <div class="stats-card">
          <h3 class="stats-card__title">Client Distribution</h3>
          <ClientStatsCharts :clientCounts="stats.clientCounts" :dark="isDark" />
        </div>

        <div class="stats-card stats-card--location">
          <LocationStatsChart
            :countryCounts="stats.countryCounts"
            :dark="isDark"
            @country-selected="locationFilter = locationFilter === $event ? '' : $event"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="dashboard__footer">
      <div class="footer__content">
        <div class="footer__info">
          <span>Linea Peers Watcher</span>
          <span class="footer__separator">•</span>
          <span class="footer__meta">Monthly snapshot via admin_peers</span>
        </div>
        <div class="footer__links">
          <a class="footer__icon-link" href="https://github.com/Othryades/lineanodemap" target="_blank" rel="noopener" aria-label="GitHub">
            <img class="footer__icon" src="/github-mark-white.svg" alt="GitHub">
          </a>
          <span class="footer__separator">•</span>
          <a href="https://linea.build" target="_blank" rel="noopener">Linea</a>
          <span class="footer__separator">•</span>
          <a href="https://docs.linea.build/developers/guides/run-a-node" target="_blank" rel="noopener">Run a node</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import MapView from '../components/MapView.vue'
import ClientStatsCharts from '../components/ClientStatsCharts.vue'
import LocationStatsChart from '../components/LocationStatsChart.vue'

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
const hasAnimatedOverlay = ref(false)
const displayTotal = ref(0)
const displayCountries = ref(0)
const displayClients = ref(0)
const tps = ref(0)
const tpsFlash = ref(false)
let tpsIntervalId = null

// Computed stats for overlay
const countryCount = computed(() => stats.value.countryCounts?.length || 0)
const clientCount = computed(() => Object.keys(stats.value.clientCounts || {}).length)
const statusDotClass = computed(() => stats.value.total > 0 ? 'status-dot--on' : 'status-dot--off')

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

function animateCount(start, end, setter, duration = 600) {
  const startTime = performance.now()
  const easeOut = t => 1 - Math.pow(1 - t, 3)

  const step = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOut(progress)
    const value = Math.round(start + (end - start) * eased)
    setter(value)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

function updateMockTps() {
  const next = Number((0.5 + Math.random() * 5.5).toFixed(1))
  tps.value = next
  tpsFlash.value = true
  setTimeout(() => { tpsFlash.value = false }, 250)
}

onMounted(() => {
  updateMockTps()
  tpsIntervalId = setInterval(updateMockTps, 4000)
})

onUnmounted(() => {
  if (tpsIntervalId) clearInterval(tpsIntervalId)
})

watch(
  () => stats.value.total,
  (total) => {
    if (hasAnimatedOverlay.value) return
    if (total <= 0) return

    hasAnimatedOverlay.value = true
    animateCount(0, total, v => displayTotal.value = v)
    animateCount(0, countryCount.value, v => displayCountries.value = v)
    animateCount(0, clientCount.value, v => displayClients.value = v)
  }
)
</script>

<style>
/* Global styles - outside scoped */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #f8fafc;
  transition: background-color 0.3s ease;
  overflow-x: hidden;
}

#app {
  margin: 0 !important;
  padding: 0 !important;
  max-width: none !important;
  text-align: left !important;
}

body.dark {
  background: #0d0f14;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

<style scoped>
/* ===========================================
   DASHBOARD LAYOUT
   =========================================== */
.dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  transition: background-color 0.3s ease;
}

.dashboard.light {
  background: #f8fafc;
  color: #1f2937;
}

.dashboard.dark {
  background: #0d0f14;
  color: #e5e7eb;
}

/* ===========================================
   STATUS BAR (Header)
   =========================================== */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 44px;
  background: #0d0f14;
  border-bottom: 1px solid #1f2933;
  z-index: 100;
}

.status-bar__left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--on {
  background: #22c55e;
}

.status-dot--off {
  background: #6b7280;
}

.status-bar__title {
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
}

.status-bar__center {
  display: flex;
  align-items: center;
}

.status-bar__info {
  font-size: 0.8125rem;
  color: #cbd5e1;
  font-weight: 500;
}

.status-bar__right {
  display: flex;
  align-items: center;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .theme-toggle {
  border-color: #374151;
  color: #9ca3af;
}

.theme-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.dark .theme-toggle:hover {
  background: #1f2937;
  color: #e5e7eb;
}

/* ===========================================
   MAP HERO SECTION
   =========================================== */
.map-hero {
  position: relative;
  height: 65vh;
  min-height: 400px;
  max-height: 800px;
  width: 100%;
  overflow: hidden;
  margin-bottom: 2rem;
}

/* ===========================================
   FLOATING STATS OVERLAY
   =========================================== */
.stats-overlay {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 1000;
  display: flex;
  align-items: stretch;
  gap: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .stats-overlay {
  background: rgba(22, 26, 34, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.2);
}

.stats-overlay__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  padding: 0 0.75rem;
  text-align: center;
}

.stats-overlay__item--tps .stats-overlay__value {
  font-size: 1.1rem;
}

.stats-overlay__value {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.dark .stats-overlay__value {
  color: #f9fafb;
}

.stats-overlay__value--tps {
  font-weight: 600;
  color: #e5e7eb;
}

.dark .stats-overlay__value--tps {
  color: #cbd5e1;
}

.stats-overlay__value--flash {
  transition: color 0.25s ease;
  color: #22d3ee;
}

.stats-overlay__item--primary .stats-overlay__value {
  font-size: 1.95rem;
  color: #0891b2;
}

.dark .stats-overlay__item--primary .stats-overlay__value {
  color: #22d3ee;
}

.stats-overlay__label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  margin-top: 3px;
  display: block;
}

.dark .stats-overlay__label {
  color: #cbd5e1;
}


.stats-overlay__divider {
  width: 1px;
  background: #e5e7eb;
  margin: -0.25rem 0;
}

.dark .stats-overlay__divider {
  background: #374151;
}

/* ===========================================
   MAP CONTROLS
   =========================================== */
.map-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  gap: 0.5rem;
}

.map-controls__btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.dark .map-controls__btn {
  background: rgba(22, 26, 34, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  color: #d1d5db;
}

.map-controls__btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.dark .map-controls__btn:hover {
  background: rgba(31, 41, 55, 0.95);
}

.map-controls__btn--active {
  background: #0891b2;
  color: white;
  border-color: transparent;
}

.dark .map-controls__btn--active {
  background: #0891b2;
  color: white;
}

/* ===========================================
   STATS SECTION
   =========================================== */
.stats-section {
  padding: 2.75rem 1.5rem 2.5rem;
}

.stats-section__container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.75rem;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.dark .stats-card {
  background: #161a22;
  border-color: rgba(255, 255, 255, 0.04);
}

.stats-card__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dark .stats-card__title {
  color: #9ca3af;
}

.stats-card--location {
  padding: 0.9rem 1.1rem;
}

.stats-card--location .stats-card__title {
  font-size: 0.8rem;
  color: #8a94a5;
}

/* ===========================================
   FOOTER
   =========================================== */
.dashboard__footer {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  margin-top: auto;
}

.dark .dashboard__footer {
  background: #0d0f14;
  border-color: #252a35;
}

.footer__content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: #6b7280;
}

.dark .footer__content {
  color: #6b7280;
}

.footer__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.footer__meta {
  color: #9ca3af;
}

.dark .footer__meta {
  color: #4b5563;
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.footer__links a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s ease;
}

.dark .footer__links a {
  color: #6b7280;
}

.footer__links a:hover {
  color: #0891b2;
}

.dark .footer__links a:hover {
  color: #22d3ee;
}

.footer__icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.footer__icon {
  width: 16px;
  height: 16px;
  display: block;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.light .footer__icon {
  filter: brightness(0);
}

.footer__icon-link:hover .footer__icon {
  opacity: 1;
}

.footer__separator {
  color: #d1d5db;
  opacity: 0.4;
}

.dark .footer__separator {
  color: #374151;
}

/* ===========================================
   RESPONSIVE
   =========================================== */
@media (max-width: 768px) {
  .status-bar {
    padding: 0.625rem 1rem;
  }

  .status-bar__center {
    display: none;
  }

  .map-hero {
    height: 55vh;
    min-height: 320px;
  }

  .stats-overlay {
    left: 12px;
    bottom: 12px;
    padding: 0.75rem 1rem;
  }

  .stats-overlay__value {
    font-size: 1.25rem;
  }

  .stats-overlay__item--primary .stats-overlay__value {
    font-size: 1.375rem;
  }

  .stats-overlay__item {
    padding: 0 0.75rem;
  }

  .map-controls {
    right: 12px;
    bottom: 12px;
  }

  .stats-section {
    padding: 1.5rem 1rem;
  }

  .stats-section__container {
    grid-template-columns: 1fr;
  }

  .footer__content {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }

  .footer__info {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-overlay {
    left: 8px;
    right: 8px;
    bottom: 8px;
    justify-content: space-around;
  }

  .stats-overlay__item {
    padding: 0 0.5rem;
  }

  .stats-overlay__value {
    font-size: 1.125rem;
  }

  .stats-overlay__item--primary .stats-overlay__value {
    font-size: 1.25rem;
  }

  .stats-overlay__label {
    font-size: 0.625rem;
  }

  .map-controls {
    display: none;
  }

  .map-hero {
    height: 50vh;
  }
}
</style>
  