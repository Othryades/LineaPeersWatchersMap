import { createApp } from 'vue'
import App from './App.vue'
import 'leaflet/dist/leaflet.css'

// ⬇️ Fix for default icon path issues in Leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// optional but helpful
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
})

document.body.classList.add('dark')

createApp(App).mount('#app')