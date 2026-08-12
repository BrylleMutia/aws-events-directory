interface Props {
  sections: string[]
  verbs: string[]
  section: string | null
  verb: string | null
  onSection: (value: string | null) => void
  onVerb: (value: string | null) => void
}

const selectClass =
  'w-full appearance-none rounded-md border border-hairline bg-card px-3 py-3 text-base text-ink-soft shadow-sm transition-colors focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/60 sm:w-auto sm:py-1.5 sm:text-xs'

export function FilterSelects({ sections, verbs, section, verb, onSection, onVerb }: Props) {
  return (
    <div className="flex gap-2">
      <label className="relative flex-1 sm:flex-none">
        <span className="sr-only">Filter by section</span>
        <select
          className={selectClass}
          value={section ?? ''}
          onChange={(e) => onSection(e.target.value || null)}
        >
          <option value="">All sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint sm:right-2.5 sm:h-3 sm:w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </label>
      <label className="relative flex-1 sm:flex-none">
        <span className="sr-only">Filter by verb</span>
        <select
          className={selectClass}
          value={verb ?? ''}
          onChange={(e) => onVerb(e.target.value || null)}
        >
          <option value="">All verbs</option>
          {verbs.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint sm:right-2.5 sm:h-3 sm:w-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </label>
    </div>
  )
}
