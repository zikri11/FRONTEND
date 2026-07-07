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
  vouchers: (serverId: string) => ['vouchers', serverId] as const,
  activity: (serverId: string) => ['activity-log', serverId] as const,
  posKeys: ['pos-keys'] as const,
}
