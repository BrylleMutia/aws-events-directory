interface Props {
  value: string
  onChange: (value: string) => void
  total: number
  shown: number
  placeholder?: string
}

export function SearchBar({ value, onChange, total, shown, placeholder }: Props) {
  return (
    <div className="relative">
      <svg
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id="search"
        type="text"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search events… e.g. RunInstances'}
        spellCheck={false}
        autoComplete="off"
        aria-label="Search events"
        className="w-full rounded-lg border border-hairline bg-card py-2 pl-10 pr-16 text-sm text-ink placeholder:text-faint shadow-sm transition-colors focus:border-accent-deep focus:outline-none focus:ring-2 focus:ring-accent/60"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="rounded-md p-1 text-faint transition-colors hover:bg-zinc-100 hover:text-ink"
          >
            <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <kbd className="rounded border border-hairline bg-paper px-1.5 py-0.5 font-mono text-[10px] text-faint">
            /
          </kbd>
        )}
        <span
          className="whitespace-nowrap rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-medium text-accent-ink-strong"
          aria-live="polite"
        >
          {value ? `${shown} / ${total}` : total}
        </span>
      </div>
    </div>
  )
}
