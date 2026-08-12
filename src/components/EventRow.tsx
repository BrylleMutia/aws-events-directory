import type { IndexedEvent } from '../lib/search'
import { CopyButton } from './CopyButton'

interface Props {
  event: IndexedEvent
  anchor: boolean
  showService: boolean
  showVpcBadge: boolean
}

export function EventRow({ event, anchor, showService, showVpcBadge }: Props) {
  const letter = event.name[0]?.toUpperCase()

  return (
    <li
      id={anchor ? `evt-${letter}` : undefined}
      className={`flex items-center gap-2 border-b border-hairline/70 px-1 py-2.5 transition-colors hover:bg-accent-tint/50 sm:py-1.5 ${
        anchor ? 'scroll-mt-[7.5rem] sm:scroll-mt-20' : ''
      }`}
    >
      <a
        href={event.url}
        target="_blank"
        rel="noreferrer"
        className="group flex min-w-0 flex-1 items-center gap-1.5"
        title={`Open ${event.name} in the AWS API Reference`}
      >
        <span className="truncate font-mono text-sm font-medium text-ink group-hover:text-accent-ink-strong sm:text-[13px]">
          {event.name}
        </span>
        <svg
          aria-hidden
          className="h-3 w-3 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      </a>

      <span className="hidden rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-500 sm:inline">
        {event.verb}
      </span>

      {showService && (
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-2 sm:py-0.5 sm:text-[10px] ${
            event.service === 'vpc'
              ? 'bg-accent-tint text-accent-ink-strong'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {event.service.toUpperCase()}
        </span>
      )}

      {showVpcBadge && (
        <span className="shrink-0 rounded-full border border-accent/50 bg-accent-tint px-2.5 py-1 text-[11px] font-semibold text-accent-ink-strong sm:px-2 sm:py-0.5 sm:text-[10px]">
          VPC
        </span>
      )}

      <CopyButton text={event.name} />
    </li>
  )
}
