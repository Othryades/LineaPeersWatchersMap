import L from 'leaflet'
import { CLIENT_CONFIG } from './constants'
import { ref, computed } from 'vue'

export function simplifyClientVersion(full) {
  const match = full.match(/([a-zA-Z]+)\/?v?([\d.]+)/)
  return match ? `${match[1]} v${match[2]}` : full
}

export function createClientIcon(clientName, isLive = false) {
  const bgColor = CLIENT_CONFIG.colors[clientName] || CLIENT_CONFIG.colors.Unknown
  const iconUrl = CLIENT_CONFIG.icons[clientName] || CLIENT_CONFIG.icons.Unknown

  return L.divIcon({
    className: 'node-icon',
    html: `
      <div class="node-icon__container" style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        border: 2px solid ${isLive ? '#22c55e' : 'white'};
        overflow: hidden;
      ">
        <img 
          src="${iconUrl}" 
          alt="${clientName}"
          style="
            width: 14px;
            height: 14px;
            object-fit: contain;
          "
        />
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  })
}

export function createNodePopup(node) {
  const versionClean = simplifyClientVersion(node.client)
  return `
    <div class="popup">
      <div class="popup__header">
        <span class="popup__icon">📍</span>
        <span class="popup__location">${node.city || 'Unknown'}, ${node.country || 'Unknown'}</span>
      </div>
      <div class="popup__content">
        <span class="popup__client">🛠️ ${versionClean}</span>
      </div>
    </div>
  `
}

export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export function throttle(fn, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
} 