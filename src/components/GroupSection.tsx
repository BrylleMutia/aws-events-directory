import type { Group } from '../hooks/useEventDirectory'
import type { ServiceInfo } from '../types'
import { EventRow } from './EventRow'

interface Props {
  group: Group
  serviceMap: Map<string, ServiceInfo>
  multiService: boolean
  singleServiceIsVpc: boolean
  anchorKeys: Set<string>
}

export function GroupSection({
  group,
  serviceMap,
  multiService,
  singleServiceIsVpc,
  anchorKeys,
}: Props) {
  const svc = serviceMap.get(group.service)
  const showService = multiService
  const showVpcBadge = !(group.service === 'vpc' || singleServiceIsVpc)

  return (
    <section aria-label={`${group.service} — ${group.section}`}>
      <h3 className="sticky top-14 z-10 -mx-4 flex items-baseline gap-2 border-b border-hairline bg-paper/95 px-4 py-1.5 backdrop-blur sm:mx-0 sm:px-0">
        {showService && svc && (
          <span className="font-mono text-xs font-semibold text-accent-ink-strong">
            {svc.name}
          </span>
        )}
        <span className="text-sm font-medium text-ink">{group.section}</span>
        <span className="text-xs tabular-nums text-faint">{group.events.length}</span>
      </h3>
      <ul>
        {group.events.map((ev) => (
          <EventRow
            key={`${ev.service}:${ev.name}`}
            event={ev}
            anchor={anchorKeys.has(`${ev.service}:${ev.name}`)}
            showService={showService}
            showVpcBadge={showVpcBadge}
          />
        ))}
      </ul>
    </section>
  )
}
