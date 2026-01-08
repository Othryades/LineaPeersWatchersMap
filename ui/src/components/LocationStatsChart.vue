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
    maxBarThickness: 20
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
</script>

<style scoped>
.location-stats-chart {
  background: transparent;
  border-radius: 10px;
  padding: 0;
  box-shadow: none;
  margin: 0;
}
h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #9ca3af;
}
:deep(canvas) {
  max-height: 340px;
}
</style> 