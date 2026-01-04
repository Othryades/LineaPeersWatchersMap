// process-peers.js
// Reads a raw peers snapshot (admin_peers style) and emits an enriched peers file
// Usage: node backend/process-peers.js /path/to/peers.json /path/to/output.json

import fs from 'fs'
import fetch from 'node-fetch'

const [, , inputPath = '/Users/moris/Downloads/peers.json', outputPath = 'ui/public/peers_new.json'] = process.argv

const CLIENT_PARSE = (clientStr = '') => {
  const lower = clientStr.toLowerCase()
  const [nameRaw, versionRaw = 'Unknown'] = clientStr.split('/')

  if (lower.includes('geth')) return { clientName: 'Geth', clientVersion: versionRaw }
  if (lower.includes('besu')) return { clientName: 'Besu', clientVersion: versionRaw }
  if (lower.includes('erigon')) return { clientName: 'Erigon', clientVersion: versionRaw }
  if (lower.includes('nethermind')) return { clientName: 'Nethermind', clientVersion: versionRaw }
  return { clientName: 'Other', clientVersion: versionRaw }
}

const isPrivateIp = (ip = '') => {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.') && (() => {
      const second = parseInt(ip.split('.')[1], 10)
      return second >= 16 && second <= 31
    })() ||
    ip.startsWith('127.') ||
    ip.startsWith('169.254.')
  )
}

const chunk = (arr, size) => {
  const res = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}

async function geolocateBatch(ips) {
  const batches = chunk(ips, 100)
  const results = {}

  for (const group of batches) {
    try {
      const resp = await fetch('http://ip-api.com/batch?fields=status,country,regionName,city,lat,lon,query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group)
      })
      const data = await resp.json()
      data.forEach(entry => {
        if (entry && entry.status === 'success') {
          results[entry.query] = {
            country: entry.country || 'Unknown',
            region: entry.regionName || '',
            city: entry.city || '',
            lat: entry.lat || 0,
            lon: entry.lon || 0
          }
        }
      })
    } catch (err) {
      console.warn('Geo batch failed, continuing:', err?.message || err)
    }
    // polite delay to avoid hammering the free endpoint
    await new Promise(r => setTimeout(r, 750))
  }

  return results
}

async function main() {
  console.log(`Reading input: ${inputPath}`)
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  const peers = raw.result || []

  // Extract entries, dedupe by enode
  const seenEnode = new Set()
  const entries = []
  for (const p of peers) {
    const enode = p.enode
    const remote = p.network?.remoteAddress || ''
    const ip = remote.split(':')[0]
    if (!enode || !ip) continue
    if (isPrivateIp(ip)) continue
    if (seenEnode.has(enode)) continue
    seenEnode.add(enode)

    const { clientName, clientVersion } = CLIENT_PARSE(p.name || '')
    entries.push({
      ip,
      client: p.name || '',
      clientName,
      clientVersion,
      enode,
    })
  }

  const uniqueIps = [...new Set(entries.map(e => e.ip))]
  console.log(`Entries after filtering: ${entries.length} (unique IPs: ${uniqueIps.length})`)

  console.log('Geolocating via ip-api.com (batch)...')
  const geoMap = await geolocateBatch(uniqueIps)

  const enriched = entries.map(e => {
    const g = geoMap[e.ip] || {}
    return {
      ...e,
      country: g.country || 'Unknown',
      region: g.region || '',
      city: g.city || '',
      lat: g.lat || 0,
      lon: g.lon || 0,
    }
  })

  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2))
  console.log(`✅ Wrote ${enriched.length} records to ${outputPath}`)
}

main().catch(err => {
  console.error('Failed to process peers:', err)
  process.exit(1)
})


