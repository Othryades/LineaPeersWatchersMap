// enrich-peers.js
import fs from 'fs'
import readline from 'readline'
import fetch from 'node-fetch'

const inputFile = './data/peers_export.txt'
const outputFile = './data/peers_enriched.json'

const rl = readline.createInterface({
  input: fs.createReadStream(inputFile),
  crlfDelay: Infinity,
})

const peers = []

const parseClientInfo = (clientStr = '') => {
  const parts = clientStr.split('/')
  const name = parts[0]?.toLowerCase()
  const version = parts[1] || 'Unknown'

  if (name.includes('geth')) return { clientName: 'Geth', clientVersion: version }
  if (name.includes('besu')) return { clientName: 'Besu', clientVersion: version }
  if (name.includes('erigon')) return { clientName: 'Erigon', clientVersion: version }
  if (name.includes('nethermind')) return { clientName: 'Nethermind', clientVersion: version }

  return { clientName: 'Other', clientVersion: version }
}

for await (const line of rl) {
  const [ipPort, client, ...enodeParts] = line.trim().split(' ')
  const [ip] = ipPort.split(':')
  const enode = enodeParts.join(' ')

  let geo = {}
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`)
    geo = await res.json()
  } catch (e) {
    console.warn(`⚠️ Failed geo lookup for ${ip}`)
  }

  const { clientName, clientVersion } = parseClientInfo(client)

  peers.push({
    ip,
    client,
    clientName,
    clientVersion,
    enode,
    country: geo.country || 'Unknown',
    region: geo.regionName || '',
    city: geo.city || '',
    lat: geo.lat || 0,
    lon: geo.lon || 0,
  })
}

fs.writeFileSync(outputFile, JSON.stringify(peers, null, 2))
console.log(`✅ Wrote enriched peer list with clientName + version to ${outputFile}`)