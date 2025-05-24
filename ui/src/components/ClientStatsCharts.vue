<template>
  <div class="client-stats-charts">
    <div class="chart-container">
      <h3>Client Distribution</h3>
      <Pie :data="pieData" :options="pieOptions" />
    </div>
    <div class="chart-container">
      <h3>Client Counts (Bar)</h3>
      <Bar :data="barData" :options="barOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Pie, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

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

const chartColors = [
  '#60a5fa', // blue
  '#fbbf24', // yellow
  '#34d399', // green
  '#f87171', // red
  '#a78bfa', // purple
  '#f472b6', // pink
  '#facc15', // gold
  '#38bdf8', // sky
  '#818cf8', // indigo
  '#f97316'  // orange
]

const pieData = computed(() => ({
  labels: Object.keys(props.clientCounts),
  datasets: [{
    data: Object.values(props.clientCounts),
    backgroundColor: chartColors,
    borderColor: props.dark ? '#1e1e2f' : '#fff',
    borderWidth: 2
  }]
}))

const pieOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: props.dark ? '#e5e7eb' : '#1f2937'
      }
    },
    title: {
      display: false
    }
  }
}))

const barData = computed(() => ({
  labels: Object.keys(props.clientCounts),
  datasets: [{
    label: 'Node Count',
    data: Object.values(props.clientCounts),
    backgroundColor: chartColors,
    borderRadius: 6
  }]
}))

const barOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  scales: {
    x: {
      ticks: { color: props.dark ? '#e5e7eb' : '#1f2937' },
      grid: { color: props.dark ? '#374151' : '#e5e7eb' }
    },
    y: {
      beginAtZero: true,
      ticks: { color: props.dark ? '#e5e7eb' : '#1f2937' },
      grid: { color: props.dark ? '#374151' : '#e5e7eb' }
    }
  }
}))
</script>

<style scoped>
.client-stats-charts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.chart-container {
  background: var(--chart-bg, #fff);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.dark .chart-container {
  --chart-bg: #2c2c3c;
}
h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: inherit;
}
</style> 