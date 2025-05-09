import express from 'express'
import { getStaticNodes } from '../controllers/staticNodesController.js'

const router = express.Router()

router.get('/', getStaticNodes)

export default router 