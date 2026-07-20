/**
 * Centralized TanStack Query key factory.
 *
 * One place for every query key so list queries and their invalidations always
 * match. Router-scoped resources take the active serverId so each router has its
 * own cache entry.
 */
export const qk = {
  servers: ['servers'] as const,
  profiles: (serverId: string) => ['profiles', serverId] as const,
  vouchers: (serverId: string, params?: { skip?: number; take?: number; profileId?: string; status?: string; search?: string }) => ['vouchers', serverId, params] as const,
  activity: (serverId: string) => ['activity-log', serverId] as const,
  posKeys: ['pos-keys'] as const,
  plans: ['plans'] as const,
  plan: (id: string) => ['plan', id] as const,
  owners: (params: {
    skip?: number
    take?: number
    search?: string
    planCode?: string
  }) => ['admin-owners', params] as const,
  owner: (id: string) => ['admin-owner', id] as const,
  healthSummary: (serverId: string, days: number) =>
    ['health-summary', serverId, days] as const,
  posStats: (tag: string) => ['pos-stats', tag] as const,
  billingInvoices: (params: { skip?: number; take?: number }) =>
    ['billing-invoices', params] as const,
  billingPlans: ['billing-plans'] as const,
}
