import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { EventItem, ServiceId, ServiceInfo } from '../types'
import { buildIndex, filterEvents } from '../lib/search'
import type { IndexedEvent } from '../lib/search'

export interface Filters {
  q: string
  services: ServiceId[]
  section: string | null
  verb: string | null
}

export interface Group {
  service: ServiceId
  section: string
  events: IndexedEvent[]
}

const DEFAULT_FILTERS: Filters = { q: '', services: [], section: null, verb: null }

function parseHash(): Filters {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const services = (params.get('svc') ?? '')
    .split(',')
    .filter((s) => s.length > 0) as ServiceId[]
  return {
    q: params.get('q') ?? '',
    services,
    section: params.get('sec') || null,
    verb: params.get('verb') || null,
  }
}

function writeHash(f: Filters) {
  const params = new URLSearchParams()
  if (f.q) params.set('q', f.q)
  if (f.services.length > 0) params.set('svc', f.services.join(','))
  if (f.section) params.set('sec', f.section)
  if (f.verb) params.set('verb', f.verb)
  const next = params.size > 0 ? `#${params.toString()}` : ''
  if (next !== window.location.hash) {
    window.history.replaceState(null, '', next)
  }
}

export function useEventDirectory(
  events: EventItem[],
  services: ServiceInfo[],
) {
  const [filters, setFilters] = useState<Filters>(() => parseHash())
  const deferredQ = useDeferredValue(filters.q)

  useEffect(() => {
    writeHash(filters)
  }, [filters])

  const indexed = useMemo(() => buildIndex(events), [events])

  const searched = useMemo(
    () => filterEvents(indexed, deferredQ),
    [indexed, deferredQ],
  )

  /* faceted counts, computed without the filter on the same dimension */
  const serviceCounts = useMemo(() => {
    const counts = new Map<ServiceId, number>(services.map((s) => [s.id, 0]))
    for (const ev of searched) {
      for (const s of ev.services) counts.set(s, (counts.get(s) ?? 0) + 1)
    }
    return counts
  }, [searched, services])

  const filteredByService = useMemo(() => {
    if (filters.services.length === 0) return searched
    return searched.filter((ev) => ev.services.some((s) => filters.services.includes(s)))
  }, [searched, filters.services])

  const sections = useMemo(() => {
    const set = new Set<string>()
    for (const ev of filteredByService) set.add(ev.section)
    return [...set].sort(compareWithOtherLast)
  }, [filteredByService])

  const verbs = useMemo(() => {
    const set = new Set<string>()
    for (const ev of filteredByService) set.add(ev.verb)
    return [...set].sort(compareWithOtherLast)
  }, [filteredByService])

  const effectiveSection =
    filters.section && sections.includes(filters.section) ? filters.section : null
  const effectiveVerb =
    filters.verb && verbs.includes(filters.verb) ? filters.verb : null

  const filtered = useMemo(() => {
    return filteredByService.filter(
      (ev) =>
        (!effectiveSection || ev.section === effectiveSection) &&
        (!effectiveVerb || ev.verb === effectiveVerb),
    )
  }, [filteredByService, effectiveSection, effectiveVerb])

  const groups = useMemo(() => {
    const multi = filters.services.length !== 1
    const byKey = new Map<string, Group>()
    for (const ev of filtered) {
      const key = multi ? `${ev.service}\u0000${ev.section}` : ev.section
      let g = byKey.get(key)
      if (!g) {
        g = {
          service: multi ? ev.service : filters.services[0],
          section: ev.section,
          events: [],
        }
        byKey.set(key, g)
      }
      g.events.push(ev)
    }
    const out = [...byKey.values()]
    out.sort((a, b) => {
      const sa = services.findIndex((s) => s.id === a.service)
      const sb = services.findIndex((s) => s.id === b.service)
      if (sa !== sb) return sa - sb
      return compareWithOtherLast(a.section, b.section)
    })
    return out
  }, [filtered, filters.services, services])

  /* first event key per starting letter, for the A-Z jump bar */
  const anchorKeys = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach((ev, i) => {
      const ch = ev.name[0]?.toUpperCase()
      if (ch && /^[A-Z]$/.test(ch) && !map.has(ch)) map.set(ch, i)
    })
    return new Set(
      [...map.entries()].map(([, i]) => `${filtered[i].service}:${filtered[i].name}`),
    )
  }, [filtered])

  const letters = useMemo(() => {
    const set = new Set<string>()
    filtered.forEach((ev) => {
      const ch = ev.name[0]?.toUpperCase()
      if (ch && /^[A-Z]$/.test(ch)) set.add(ch)
    })
    return [...set].sort()
  }, [filtered])

  const hasFilters =
    filters.q.trim() !== '' ||
    filters.services.length > 0 ||
    effectiveSection !== null ||
    effectiveVerb !== null

  const totalCounts = useMemo(
    () => new Map(services.map((s) => [s.id, events.filter((e) => e.services.includes(s.id)).length])),
    [events, services],
  )

  return {
    filters,
    setFilters,
    deferredQ,
    serviceCounts,
    totalCounts,
    sections,
    verbs,
    effectiveSection,
    effectiveVerb,
    filtered,
    groups,
    anchorKeys,
    letters,
    hasFilters,
    reset: () => setFilters(DEFAULT_FILTERS),
  }
}

function compareWithOtherLast(a: string, b: string): number {
  if (a === 'Other' && b !== 'Other') return 1
  if (b === 'Other' && a !== 'Other') return -1
  return a.localeCompare(b)
}
