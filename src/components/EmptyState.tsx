interface Props {
  onReset: () => void
}

export function EmptyState({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
        <svg aria-hidden className="h-5 w-5 text-accent-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
          <path d="M8 11h6" />
        </svg>
      </span>
      <div>
        <p className="text-base font-medium text-ink sm:text-sm">No events match your filters</p>
        <p className="mt-1 text-sm text-muted sm:text-xs">
          Try a different search term, or clear the filters to see everything again.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-accent-deep bg-accent-tint px-4 py-2.5 text-sm font-medium text-accent-ink-strong transition-colors hover:bg-accent/40 sm:px-3 sm:py-1.5 sm:text-xs"
      >
        Clear all filters
      </button>
    </div>
  )
}
