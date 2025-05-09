import express from 'express'
import { getLiveNodes } from '../controllers/liveNodesController.js'

const router = express.Router()

router.get('/', getLiveNodes)

export default router 