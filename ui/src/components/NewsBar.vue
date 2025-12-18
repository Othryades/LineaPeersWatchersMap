<template>
  <div :class="['news-bar', isDark ? 'dark' : 'light']">
    <div class="news-bar__container">
      <div class="news-bar__label">
        <span class="news-dot"></span>
         updates
      </div>
      <div class="news-bar__content">
        <div class="news-bar__scroll" ref="scrollContent">
          <span class="news-item">
            {{ currentMessage }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isDark: {
    type: Boolean,
    default: false
  },
  messages: {
    type: Array,
    default: () => [
      'Linea ecosystem continues to grow, check https://linea.build/hub',
      'Linea Mainnet is now running on Osaka EVM since 12/03/2025!',
   ]
  },
  scrollSpeed: {
    type: Number,
    default: 50 // pixels per second
  }
})

const scrollContent = ref(null)
const currentMessage = ref('')
const messageIndex = ref(0)
let animationId = null
let lastTimestamp = 0

const startScrolling = () => {
  if (!scrollContent.value) return
  
  const content = scrollContent.value
  const container = content.parentElement
  const containerWidth = container.offsetWidth
  const contentWidth = content.scrollWidth
  
  let scrollPosition = containerWidth
  
  const animate = (timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp
    const deltaTime = (timestamp - lastTimestamp) / 1000
    
    scrollPosition -= props.scrollSpeed * deltaTime
    
    // Reset position when content is completely off screen
    if (scrollPosition < -contentWidth) {
      scrollPosition = containerWidth
      // Move to next message
      messageIndex.value = (messageIndex.value + 1) % props.messages.length
      currentMessage.value = props.messages[messageIndex.value]
    }
    
    content.style.transform = `translateX(${scrollPosition}px)`
    
    lastTimestamp = timestamp
    animationId = requestAnimationFrame(animate)
  }
  
  animationId = requestAnimationFrame(animate)
}

const stopScrolling = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

onMounted(() => {
  currentMessage.value = props.messages[0]
  // Start scrolling after a short delay to ensure DOM is ready
  setTimeout(() => {
    startScrolling()
  }, 100)
})

onUnmounted(() => {
  stopScrolling()
})
</script>

<style scoped>
.news-bar {
  background: linear-gradient(90deg, #10b981, #059669);
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  overflow: hidden;
  position: relative;
  z-index: 50;
}

.news-bar.dark {
  background: linear-gradient(90deg, #065f46, #047857);
}

.news-bar__container {
  display: flex;
  align-items: center;
  height: 100%;
  max-width: 100%;
}

.news-bar__label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.1);
  height: 100%;
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.news-dot {
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.news-bar__content {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
}

.news-bar__scroll {
  white-space: nowrap;
  display: flex;
  align-items: center;
  height: 100%;
  will-change: transform;
}

.news-item {
  padding: 0 32px;
  display: inline-block;
  line-height: 40px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .news-bar {
    font-size: 13px;
    height: 36px;
  }
  
  .news-bar__label {
    padding: 0 12px;
    font-size: 12px;
  }
  
  .news-item {
    line-height: 36px;
    padding: 0 24px;
  }
}

@media (max-width: 480px) {
  .news-bar {
    font-size: 12px;
    height: 32px;
  }
  
  .news-bar__label {
    padding: 0 8px;
    font-size: 11px;
  }
  
  .news-item {
    line-height: 32px;
    padding: 0 16px;
  }
}
</style> 