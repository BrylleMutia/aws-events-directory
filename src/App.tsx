import { useEffect, useMemo } from 'react'
import eventsData from './data/events.json'
import servicesData from './data/services.json'
import type { EventsData, ServicesData } from './types'
import { useEventDirectory } from './hooks/useEventDirectory'
import { SearchBar } from './components/SearchBar'
import { ServiceChips } from './components/ServiceChips'
import { FilterSelects } from './components/FilterSelects'
import { LetterBar } from './components/LetterBar'
import { GroupSection } from './components/GroupSection'
import { EmptyState } from './components/EmptyState'

const events = (eventsData as EventsData).events
const services = (servicesData as ServicesData).services

export default function App() {
  const dir = useEventDirectory(events, services)
  const serviceMap = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [],
  )

  /* press "/" to focus search, Escape to clear */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (e.key === '/' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA' && target?.tagName !== 'SELECT') {
        e.preventDefault()
        document.getElementById('search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const jump = (letter: string) => {
    document.getElementById(`evt-${letter}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const multiService = dir.filters.services.length !== 1
  const singleServiceIsVpc =
    dir.filters.services.length === 1 && dir.filters.services[0] === 'vpc'
  const { meta } = eventsData as EventsData

  return (
    <div className="min-h-dvh">
      {/* Brand row (scrolls away) */}
      <header className="page pt-5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-6 w-6 rounded-md bg-gradient-to-br from-accent to-accent-deep"
          />
          <div>
            <h1 className="text-sm font-semibold leading-tight text-ink">
              AWS Events Directory
            </h1>
            <p className="text-xs leading-tight text-muted">
              CloudTrail events from the core building blocks of AWS
            </p>
          </div>
          <a
            href="https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-supported-services.html"
            target="_blank"
            rel="noreferrer"
            className="ml-auto hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-zinc-100 hover:text-ink sm:flex"
          >
            Source: AWS docs
            <svg aria-hidden className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </a>
        </div>
      </header>

      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 mt-4 h-14 border-b border-hairline bg-paper/95 backdrop-blur">
        <div className="page flex h-14 items-center">
          <SearchBar
            value={dir.filters.q}
            onChange={(q) => dir.setFilters((f) => ({ ...f, q }))}
            total={meta.totalEvents}
            shown={dir.filtered.length}
          />
        </div>
      </div>

      <main className="page pb-24">
        {/* Filters */}
        <div className="flex flex-col gap-2 py-3">
          <ServiceChips
            services={services}
            selected={dir.filters.services}
            counts={dir.serviceCounts}
            totals={dir.totalCounts}
            onChange={(svc) => dir.setFilters((f) => ({ ...f, services: svc }))}
          />
          <FilterSelects
            sections={dir.sections}
            verbs={dir.verbs}
            section={dir.effectiveSection}
            verb={dir.effectiveVerb}
            onSection={(sec) => dir.setFilters((f) => ({ ...f, section: sec }))}
            onVerb={(verb) => dir.setFilters((f) => ({ ...f, verb }))}
          />
        </div>

        {/* A-Z jump bar */}
        {dir.filters.q.trim() === '' && (
          <div className="mb-2 border-b border-hairline/70 pb-1">
            <LetterBar letters={dir.letters} onJump={jump} />
          </div>
        )}

        {dir.groups.length === 0 ? (
          <EmptyState onReset={dir.reset} />
        ) : (
          dir.groups.map((g) => (
            <GroupSection
              key={`${g.service}:${g.section}`}
              group={g}
              serviceMap={serviceMap}
              multiService={multiService}
              singleServiceIsVpc={singleServiceIsVpc}
              anchorKeys={dir.anchorKeys}
            />
          ))
        )}

        <footer className="mt-12 border-t border-hairline pt-4 text-xs leading-relaxed text-faint">
          <p>
            {meta.totalEvents} CloudTrail events across{' '}
            {services.map((s) => s.name).join(', ')}. Data scraped from the public
            AWS API Reference on {meta.generatedAt} — event names, sections, and
            links may change as AWS ships new API actions.
          </p>
          <p className="mt-1">
            Click an event name to open its API reference page in a new tab.
          </p>
        </footer>
      </main>
    </div>
  )
}
