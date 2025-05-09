import { liveNodes } from '../liveNodesState.js'

export function getLiveNodes(req, res) {
  // Only return active nodes
  const result = Array.from(liveNodes.values()).filter(node => node.active)
  res.json(result)
} 