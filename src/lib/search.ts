import type { EventItem } from '../types'

export interface IndexedEvent extends EventItem {
  lowerName: string
  lowerSearch: string
}

/** Split a CamelCase name into lowercased parts: "CreateVpc" -> ["create", "vpc"]. */
function camelParts(name: string): string[] {
  return name.match(/[A-Z][a-z]+/g)?.map((p) => p.toLowerCase()) ?? []
}

export function buildIndex(events: EventItem[]): IndexedEvent[] {
  return events.map((e) => ({
    ...e,
    lowerName: e.name.toLowerCase(),
    lowerSearch: [e.name, e.service, e.section, e.verb].join(' ').toLowerCase(),
  }))
}

/**
 * Rank an event against search tokens. Lower is better.
 *  0 exact name match, 1 name prefix, 2 camel-part match (CreateVpc vs "vpc"),
 *  3 name substring, 4 section/verb/service match. -1 = no match.
 */
function scoreEvent(ev: IndexedEvent, tokens: string[]): number {
  let worst = 0
  for (const tok of tokens) {
    let score: number
    if (ev.lowerName === tok) score = 0
    else if (ev.lowerName.startsWith(tok)) score = 1
    else if (camelParts(ev.name).includes(tok)) score = 2
    else if (ev.lowerName.includes(tok)) score = 3
    else if (ev.lowerSearch.includes(tok)) score = 4
    else return -1
    if (score > worst) worst = score
  }
  return worst
}

export function filterEvents(indexed: IndexedEvent[], query: string): IndexedEvent[] {
  const q = query.trim().toLowerCase()
  if (!q) return indexed
  const tokens = q.split(/\s+/).filter(Boolean)
  const hits: Array<{ ev: IndexedEvent; score: number }> = []
  for (const ev of indexed) {
    const score = scoreEvent(ev, tokens)
    if (score >= 0) hits.push({ ev, score })
  }
  hits.sort(
    (a, b) =>
      a.score - b.score ||
      a.ev.name.localeCompare(b.ev.name) ||
      a.ev.service.localeCompare(b.ev.service),
  )
  return hits.map((h) => h.ev)
}
