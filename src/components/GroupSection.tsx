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
      <h3 className="sticky top-[113px] z-10 -mx-4 flex items-baseline gap-2 border-b border-hairline bg-paper/95 px-4 py-2 backdrop-blur sm:top-14 sm:mx-0 sm:px-0 sm:py-1.5">
        {showService && svc && (
          <span className="font-mono text-sm font-semibold text-accent-ink-strong sm:text-xs">
            {svc.name}
          </span>
        )}
        <span className="text-[15px] font-medium text-ink sm:text-sm">{group.section}</span>
        <span className="text-sm tabular-nums text-faint sm:text-xs">{group.events.length}</span>
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
