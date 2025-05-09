import express from 'express'
import cors from 'cors'
import { PORT } from './config/index.js'
import staticNodesRouter from './routes/staticNodes.js'
import liveNodesRouter from './routes/liveNodes.js'
import './liveNodesState.js' // initializes websocket and state

const app = express()

app.use(cors())

app.use('/static-nodes', staticNodesRouter)
app.use('/live-nodes', liveNodesRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})