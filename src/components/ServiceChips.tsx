import type { ServiceId, ServiceInfo } from '../types'

interface Props {
  services: ServiceInfo[]
  selected: ServiceId[]
  counts: Map<ServiceId, number>
  totals: Map<ServiceId, number>
  onChange: (next: ServiceId[]) => void
}

export function ServiceChips({ services, selected, counts, totals, onChange }: Props) {
  const toggle = (id: ServiceId) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {services.map((svc) => {
        const active = selected.includes(svc.id)
        const count = counts.get(svc.id) ?? 0
        const total = totals.get(svc.id) ?? 0
        return (
          <button
            key={svc.id}
            type="button"
            onClick={() => toggle(svc.id)}
            aria-pressed={active}
            title={`${svc.fullName} — ${count} events`}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-3.5 text-sm font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs ${
              active
                ? 'border-accent-deep bg-accent-tint text-accent-ink-strong'
                : 'border-hairline bg-card text-ink-soft hover:border-zinc-300'
            }`}
          >
            <span className="font-mono text-xs font-semibold sm:text-[11px]">{svc.name}</span>
            <span className={`text-xs tabular-nums sm:text-[11px] ${active ? 'text-accent-ink-strong' : 'text-faint'}`}>
              {count}{count !== total ? `/${total}` : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
