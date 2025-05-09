import Primus from 'primus'

export const liveNodes = new Map();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 5000; // 5 seconds

function connectWebSocket() {
  const Socket = Primus.createSocket({ transformer: 'websockets' });
  const socket = new Socket('wss://ethstats.linea.build/primus?secret=asdf');

  socket.on('open', () => {
    console.log('✅ Connected to ethstats');
    reconnectAttempts = 0; // Reset attempts on successful connection
  });

  socket.on('data', (msg) => {
    try {
      const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
      
      // Handle node stats updates
      if (data.action === 'stats') {
        const id = data.data?.id;
        if (id) {
          // Only count nodes that are active (have stats)
          if (data.data.stats) {
            liveNodes.set(id, {
              ...data.data,
              updatedAt: Date.now(),
              source: 'ethstats',
              active: true
            });
          } else {
            // Node exists but is inactive
            const existingNode = liveNodes.get(id);
            if (existingNode) {
              existingNode.active = false;
              existingNode.updatedAt = Date.now();
              liveNodes.set(id, existingNode);
            }
          }
        }
      }
      
      // Handle node disconnections
      else if (data.action === 'inactive' || data.action === 'end') {
        const id = data.data;
        if (id && liveNodes.has(id)) {
          console.log(`Node ${id} disconnected`);
          liveNodes.delete(id);
        }
      }

    } catch (err) {
      console.warn('⚠️ Failed to parse WebSocket data:', err);
    }
  });

  socket.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
  });

  socket.on('end', () => {
    console.log('📡 Disconnected from WebSocket');
    
    // Try to reconnect if we haven't exceeded max attempts
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectWebSocket, RECONNECT_DELAY);
    } else {
      console.error('❌ Max reconnection attempts reached. Please check the connection manually.');
    }
  });

  return socket;
}

// Initial connection
connectWebSocket();

// Prune stale nodes every minute
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 2 * 60 * 1000; // 2 minutes (more aggressive)
  let pruneCount = 0;
  
  for (const [id, node] of liveNodes.entries()) {
    if (now - node.updatedAt > staleThreshold) {
      console.log(`Pruning stale node ${id} (last updated ${Math.floor((now - node.updatedAt) / 1000)}s ago)`);
      liveNodes.delete(id);
      pruneCount++;
    }
  }
  
  if (pruneCount > 0) {
    console.log(`🧹 Pruned ${pruneCount} stale nodes. Current live nodes: ${liveNodes.size}`);
  }
}, 60 * 1000); // Run every minute instead of every 5 minutes 