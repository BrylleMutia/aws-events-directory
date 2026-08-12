/**
 * Scrapes CloudTrail event names for core AWS services from the public AWS docs.
 *
 * Sources: each service's API Reference "API_Operations.html" page, which lists
 * every API action (all of which are logged by CloudTrail).
 *
 * Output (committed to the repo, imported statically by the app):
 *   - src/data/events.json
 *   - src/data/services.json
 *
 * Usage: npm run scrape
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ACTION_RE = /href="(?:\.\/)?(API_[A-Za-z0-9]+\.html)"[^>]*>([^<]+)<\/a>/g

const sources = JSON.parse(await readFile(join(ROOT, 'scripts', 'sources.json'), 'utf8'))
const sections = JSON.parse(await readFile(join(ROOT, 'scripts', 'sections.json'), 'utf8'))

const vpcList = (await readFile(join(ROOT, 'scripts', 'vpc-actions.txt'), 'utf8'))
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .sort()

async function fetchWithRetry(url, attempts = 3) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent':
            'aws-events-directory-scraper/1.0 (+https://docs.aws.amazon.com)',
          accept: 'text/html',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      return await res.text()
    } catch (err) {
      lastError = err
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
    }
  }
  throw lastError
}

/** Pull "ActionName" entries out of an API_Operations page. */
function parseActions(html) {
  const names = []
  for (const match of html.matchAll(ACTION_RE)) {
    const href = match[1]
    const label = match[2].trim()
    const name = href.replace(/^API_/, '').replace(/\.html$/, '')
    if (label !== name) continue // skip non-action links
    names.push({ name, href })
  }
  return [...new Map(names.map((n) => [n.name, n])).values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

/** First camel-case word of an action name, e.g. "RunInstances" -> "Run". */
function verbOf(name) {
  return name.match(/^[A-Z][a-z]+/)?.[0] ?? 'Other'
}

/** Map an action name to a section using the first matching rule. */
function sectionOf(serviceId, name) {
  const rules = sections[serviceId] ?? []
  for (const rule of rules) {
    if (rule.patterns.length === 0) return rule.section
    if (rule.patterns.some((p) => name.includes(p))) return rule.section
  }
  return 'Other'
}

function eventUrl(pagePrefix, name) {
  return `${pagePrefix}API_${name}.html`
}

/* ---------------------------------- run ---------------------------------- */

const realServices = sources.services.filter((s) => !s.virtual)
const scraped = {}

console.log('Fetching API_Operations pages…')
for (const svc of realServices) {
  const html = await fetchWithRetry(svc.operationsUrl)
  const actions = parseActions(html)
  scraped[svc.id] = actions
  console.log(`  ${svc.id.padEnd(3)} ${actions.length.toString().padStart(4)} actions  <- ${svc.operationsUrl}`)
}

/* validate the curated VPC list against the scraped EC2 action set */
const ec2Names = new Set(scraped.ec2.map((a) => a.name))
const missing = vpcList.filter((name) => !ec2Names.has(name))
if (missing.length > 0) {
  console.warn(`\nWARNING: ${missing.length} curated VPC actions not found in the EC2 action list:`)
  console.warn(`  ${missing.join(', ')}`)
}

/* build events */
const events = []
for (const svc of realServices) {
  for (const { name } of scraped[svc.id]) {
    const tags = [svc.id]
    if (svc.id === 'ec2' && vpcList.includes(name)) tags.push('vpc')
    events.push({
      name,
      service: svc.id,
      services: tags,
      section: sectionOf(svc.id, name),
      verb: verbOf(name),
      url: eventUrl(svc.pagePrefix, name),
    })
  }
}
events.sort((a, b) => a.service.localeCompare(b.service) || a.name.localeCompare(b.name))

/* validation */
const seen = new Set()
let dupes = 0
for (const ev of events) {
  const key = `${ev.service}:${ev.name}`
  if (seen.has(key)) {
    dupes++
    console.warn(`duplicate: ${key}`)
  }
  seen.add(key)
}

/* write outputs */
const servicesOut = {
  services: sources.services.map((s) => ({
    id: s.id,
    name: s.name,
    fullName: s.fullName,
    eventSourcePrefix: s.eventSourcePrefix,
    docsUrl: s.docsUrl,
    virtual: !!s.virtual,
  })),
}

const counts = Object.fromEntries(
  realServices.map((s) => [s.id, events.filter((e) => e.service === s.id).length]),
)
counts.vpc = events.filter((e) => e.services.includes('vpc')).length

const dataOut = {
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    totalEvents: events.length,
    counts,
    sources: Object.fromEntries(realServices.map((s) => [s.id, s.operationsUrl])),
  },
  events,
}

await mkdir(join(ROOT, 'src', 'data'), { recursive: true })
await writeFile(join(ROOT, 'src', 'data', 'events.json'), JSON.stringify(dataOut, null, 2) + '\n', 'utf8')
await writeFile(join(ROOT, 'src', 'data', 'services.json'), JSON.stringify(servicesOut, null, 2) + '\n', 'utf8')

console.log(`\nDone. ${events.length} events (${dupes} duplicates), ${events.filter((e) => e.services.includes('vpc')).length} VPC-tagged.`)
