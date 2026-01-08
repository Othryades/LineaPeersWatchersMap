<template>
  <div class="client-stack">
    <div class="client-stack__bar" role="img" aria-label="Client distribution">
      <div
        v-for="segment in segments"
        :key="segment.name"
        class="client-stack__segment"
        :style="{
          width: segment.percent + '%',
          backgroundColor: segment.color
        }"
        :title="`${segment.name}: ${segment.count} nodes (${segment.percent.toFixed(1)}%)`"
      >
        <span
          v-if="segment.percent >= 12"
          class="client-stack__label"
        >
          {{ segment.name }} {{ Math.round(segment.percent) }}%
        </span>
      </div>
    </div>

    <div class="client-stack__legend" aria-hidden="true">
      <div v-for="segment in segments" :key="segment.name" class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: segment.color }"></span>
        <span class="legend-text">
          {{ segment.name }} · {{ Math.round(segment.percent) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  clientCounts: {
    type: Object,
    required: true
  },
  dark: {
    type: Boolean,
    default: false
  }
})

const CLIENT_COLORS = {
  Geth: '#60a5fa',
  Besu: '#fbbf24',
  Erigon: '#34d399',
  Nethermind: '#f87171',
  Unknown: '#a78bfa'
}

const orderedClients = ['Geth', 'Besu', 'Erigon', 'Nethermind', 'Unknown']

const segments = computed(() => {
  const total = Object.values(props.clientCounts || {}).reduce((sum, v) => sum + v, 0) || 0
  if (!total) return []

  return orderedClients
    .map(name => {
      const count = props.clientCounts?.[name] || 0
      const percent = total ? (count / total) * 100 : 0
      return {
        name,
        count,
        percent,
        color: CLIENT_COLORS[name] || '#94a3b8'
      }
    })
    .filter(segment => segment.count > 0)
})
</script>

<style scoped>
.client-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.client-stack__bar {
  display: flex;
  width: 100%;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--stack-bg, #e5e7eb);
  border: 1px solid var(--stack-border, #e5e7eb);
}

.dark .client-stack__bar {
  --stack-bg: #111827;
  --stack-border: #1f2937;
}

.client-stack__segment {
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2%;
}

.client-stack__label {
  color: #0b111f;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}

.dark .client-stack__label {
  color: #f8fafc;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.client-stack__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.8125rem;
  color: #6b7280;
}

.dark .client-stack__legend {
  color: #9ca3af;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.legend-text {
  letter-spacing: -0.01em;
}
</style>