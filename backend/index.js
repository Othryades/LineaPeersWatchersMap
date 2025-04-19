// import express from 'express'
// import fs from 'fs/promises'
// import cors from 'cors'

// const app = express()
// const PORT = 3001

// app.use(cors())

// app.get('/static-nodes', async (req, res) => {
//   try {
//     const data = await fs.readFile('./data/peers_enriched.json', 'utf8')
//     const peers = JSON.parse(data)
//     res.json(peers)
//   } catch (err) {
//     console.error('Failed to read static node data:', err)
//     res.status(500).json({ error: 'Failed to load nodes' })
//   }
// })

// app.listen(PORT, () => {
//   console.log(`📡 Backend running on http://localhost:${PORT}`)
// })

import express from 'express'
import fs from 'fs/promises'
import cors from 'cors'
import Primus from 'primus'
import http from 'http'

const app = express()
const PORT = 3001

app.use(cors())

// Route: Static peer data from file
app.get('/static-nodes', async (req, res) => {
  try {
    const data = await fs.readFile('./data/peers_enriched.json', 'utf8')
    const peers = JSON.parse(data)
    res.json(peers)
  } catch (err) {
    console.error('❌ Failed to read static node data:', err)
    res.status(500).json({ error: 'Failed to load nodes' })
  }
})

// -------------------------------
// 🔌 Live WebSocket listener
// -------------------------------
const liveNodes = new Map();

// KEEP THIS INSTEAD:
const Socket = Primus.createSocket({ transformer: 'websockets' });
const socket = new Socket('wss://ethstats.linea.build/primus?secret=asdf');

socket.on('open', () => {
  console.log('✅ Connected to ethstats');
});

socket.on('data', (msg) => {
  try {
    const data = typeof msg === 'string' ? JSON.parse(msg) : msg;

    if (data.action === 'block' || data.action === 'stats') {
      const id = data.data?.id;
      if (id) {
        liveNodes.set(id, {
          ...data.data,
          updatedAt: Date.now(),
          source: 'ethstats'
        });
        console.log('[ws]', data);
      }
    }
  } catch (err) {
    console.warn('⚠️ Failed to parse WebSocket data:', err);
  }
});

// Optional: prune stale nodes every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [id, node] of liveNodes.entries()) {
    if (now - node.updatedAt > 10 * 60 * 1000) {
      liveNodes.delete(id);
    }
  }
}, 5 * 60 * 1000);

socket.on('end', () => {
  console.log('❌ Disconnected from WebSocket')
})

// Route: Serve live node data
app.get('/live-nodes', (req, res) => {
  const result = Array.from(liveNodes.values())
  res.json(result)
})

// -------------------------------
app.listen(PORT, () => {
  console.log(`📡 Backend running on http://localhost:${PORT}`)
})