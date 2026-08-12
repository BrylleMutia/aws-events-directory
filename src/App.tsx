import { useEffect, useMemo, useState } from 'react'
import eventsData from './data/events.json'
import servicesData from './data/services.json'
import type { EventsData, ServicesData, ServiceId } from './types'
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

  /* mobile-only back-to-top button */
  const [showTop, setShowTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const chipsProps = {
    services,
    selected: dir.filters.services,
    counts: dir.serviceCounts,
    totals: dir.totalCounts,
    onChange: (svc: ServiceId[]) => dir.setFilters((f) => ({ ...f, services: svc })),
  }

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
            <h1 className="text-base font-semibold leading-tight text-ink sm:text-sm">
              AWS Events Directory
            </h1>
            <p className="text-[13px] leading-tight text-muted sm:text-xs">
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

      {/* Sticky search bar + service chips (mobile) */}
      <div className="sticky top-0 z-20 mt-4 border-b border-hairline bg-paper/95 backdrop-blur">
        <div className="page flex h-14 items-center">
          <SearchBar
            value={dir.filters.q}
            onChange={(q) => dir.setFilters((f) => ({ ...f, q }))}
            total={meta.totalEvents}
            shown={dir.filtered.length}
          />
        </div>
        <div className="page flex h-14 items-center sm:hidden">
          <ServiceChips {...chipsProps} />
        </div>
      </div>

      <main className="page pb-24">
        {/* Filters */}
        <div className="flex flex-col gap-2 py-3">
          <div className="hidden sm:block">
            <ServiceChips {...chipsProps} />
          </div>
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

      {/* Mobile back-to-top */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-accent-deep bg-accent text-ink shadow-md transition-all ${
          showTop ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  )
}
