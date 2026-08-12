export type ServiceId = 'iam' | 'sts' | 'ec2' | 'vpc' | 'rds'

export interface EventItem {
  name: string
  service: ServiceId
  services: ServiceId[]
  section: string
  verb: string
  url: string
}

export interface ServiceInfo {
  id: ServiceId
  name: string
  fullName: string
  eventSourcePrefix: string
  docsUrl: string
  virtual: boolean
}

export interface EventsData {
  meta: {
    generatedAt: string
    totalEvents: number
    counts: Record<string, number>
    sources: Record<string, string>
  }
  events: EventItem[]
}

export interface ServicesData {
  services: ServiceInfo[]
}
