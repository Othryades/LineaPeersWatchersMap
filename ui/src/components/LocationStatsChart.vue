<template>
  <div
    class="location-stats-chart"
    
  >
    <h3>Location Distribution</h3>
    <Bar :data="barData" :options="barOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const emit = defineEmits(['country-selected'])

const props = defineProps({
  countryCounts: {
    type: Array,
    required: true
  },
  dark: {
    type: Boolean,
    default: false
  }
})

const chartColors = [
  '#60a5fa', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6', '#facc15', '#38bdf8', '#818cf8', '#f97316',
  '#4ade80', '#f472b6', '#fbbf24', '#a3e635', '#f87171', '#38bdf8', '#818cf8', '#f97316', '#facc15', '#a78bfa'
]

const barData = computed(() => ({
  labels: props.countryCounts.map(c => c.country),
  datasets: [{
    label: 'Nodes',
    data: props.countryCounts.map(c => c.count),
    backgroundColor: chartColors,
    borderRadius: 8,
    maxBarThickness: 24
  }]
}))

const barOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => ` ${ctx.parsed.x} nodes`
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: props.dark ? '#e5e7eb' : '#1f2937' },
      grid: { color: props.dark ? '#374151' : '#e5e7eb' }
    },
    y: {
      ticks: {
        color: props.dark ? '#e5e7eb' : '#1f2937',
        autoSkip: false,
        maxTicksLimit: 100,
        font: { size: 12 },
        callback: function(value, index, values) {
          const label = this.getLabelForValue ? this.getLabelForValue(value) : value;
          return label.length > 15 ? label.slice(0, 12) + '…' : label;
        }
      },
      grid: { color: props.dark ? '#374151' : '#e5e7eb' }
    }
  },
  onClick: (evt, elements, chart) => {
    if (elements.length > 0) {
      const idx = elements[0].index
      const country = props.countryCounts[idx]?.country
      if (country) emit('country-selected', country)
    }
  }
}))

console.log('LocationStatsChart countries:', props.countryCounts.map(c => c.country));
</script>

<style scoped>
.location-stats-chart {
  background: var(--chart-bg, #fff);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 1.5rem;
}
.dark .location-stats-chart {
  --chart-bg: #2c2c3c;
}
h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
}
</style> 