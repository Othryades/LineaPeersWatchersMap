import fs from 'fs/promises'

export async function getStaticNodes(req, res) {
  try {
    const data = await fs.readFile('./data/data.json', 'utf8')
    const peers = JSON.parse(data)
    res.json(peers)
  } catch (err) {
    console.error('Failed to read static node data:', err)
    res.status(500).json({ error: 'Failed to load nodes' })
  }
} 