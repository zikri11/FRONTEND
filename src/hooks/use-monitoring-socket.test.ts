import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { io, type Socket } from 'socket.io-client'
import { useMonitoringSocket } from './use-monitoring-socket'
import { useAuthStore } from '@/stores/auth-store'

vi.mock('socket.io-client', () => ({ io: vi.fn() }))

function createFakeSocket(subscribeAck: { ok: boolean } = { ok: true }) {
  const handlers: Record<string, (...args: unknown[]) => void> = {}
  const managerHandlers: Record<string, (...args: unknown[]) => void> = {}
  const socket = {
    connected: false,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = cb
    }),
    emit: vi.fn((event: string, _payload: unknown, ack?: (res: unknown) => void) => {
      if (event === 'subscribe' && ack) ack(subscribeAck)
    }),
    disconnect: vi.fn(),
    // Manager real socket.io-client: event 'reconnect_failed' cs emit di sini,
    // BUKAN di `socket` itu sendiri — lihat catatan di test reconnect_failed.
    io: {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        managerHandlers[event] = cb
      }),
    },
    trigger: (event: string, payload?: unknown) => handlers[event]?.(payload),
    triggerManager: (event: string, payload?: unknown) =>
      managerHandlers[event]?.(payload),
  }
  return socket as unknown as Socket & typeof socket
}

beforeEach(() => {
  useAuthStore.getState().auth.setAccessToken('test-token')
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000/api')
  vi.mocked(io).mockReset()
})

describe('useMonitoringSocket', () => {
  it('does not connect when disabled', async () => {
    const { result } = await renderHook(() => useMonitoringSocket('srv-1', false))
    expect(io).not.toHaveBeenCalled()
    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('does not connect when serverId is null', async () => {
    const { result } = await renderHook(() => useMonitoringSocket(null, true))
    expect(io).not.toHaveBeenCalled()
    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('connects to the monitoring namespace with the auth token, does not subscribe before connect', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    await renderHook(() => useMonitoringSocket('srv-1', true))

    expect(io).toHaveBeenCalledWith(
      'http://localhost:4000/monitoring',
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      })
    )
    expect(fake.emit).not.toHaveBeenCalledWith(
      'subscribe',
      expect.anything(),
      expect.anything()
    )
  })

  it('subscribes once connect fires, becomes live on ack ok', async () => {
    const fake = createFakeSocket({ ok: true })
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })

    expect(fake.emit).toHaveBeenCalledWith(
      'subscribe',
      { serverId: 'srv-1' },
      expect.any(Function)
    )
    expect(result.current.wsStatus).toBe('live')
  })

  it('becomes unavailable when the subscribe ack fails', async () => {
    const fake = createFakeSocket({ ok: false })
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })

    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('updates state from a snapshot event matching the subscribed server', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    await act(() => {
      fake.trigger('snapshot', {
        serverId: 'srv-1',
        activeUsers: [{ username: 'budi', ipAddress: '10.0.0.2', macAddress: 'AA:BB', uptime: '1h' }],
        resources: {
          uptime: '1h', cpuLoad: 10, cpuCount: 1, freeMemory: 1, totalMemory: 2,
          freeHddSpace: 1, totalHddSpace: 2, version: '7.1', boardName: 'hAP', architectureName: 'arm',
        },
        traffic: [{ id: 'ether1', name: 'ether1', rxByte: 100, txByte: 50, running: true }],
      })
    })

    expect(result.current.activeUsers).toEqual([
      { username: 'budi', ipAddress: '10.0.0.2', macAddress: 'AA:BB', uptime: '1h' },
    ])
    expect(result.current.resources?.boardName).toBe('hAP')
    expect(result.current.traffic).toHaveLength(1)
  })

  it('ignores a snapshot event for a stale (non-subscribed) server', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    await act(() => {
      fake.trigger('snapshot', {
        serverId: 'srv-OLD',
        activeUsers: [{ username: 'harusnya-diabaikan' }],
        resources: null,
        traffic: [],
      })
    })

    expect(result.current.activeUsers).toEqual([])
  })

  it('updates routerConnected from a status event', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    await act(() => {
      fake.trigger('status', { serverId: 'srv-1', connected: false })
    })

    expect(result.current.routerConnected).toBe(false)
  })

  it('goes unavailable and disconnects on an unauthorized event', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.trigger('unauthorized')
    })

    expect(result.current.wsStatus).toBe('unavailable')
    expect(fake.disconnect).toHaveBeenCalled()
  })

  it('goes unavailable when reconnection attempts are exhausted', async () => {
    // 'reconnect_failed' adalah event Manager (socket.io-client v4), bukan
    // event Socket — di real socket.io-client hanya bisa didengar lewat
    // `socket.io.on(...)`, tidak pernah lewat `socket.on(...)`. Mulai dari
    // status 'live' dulu (bukan default 'unavailable') supaya assert di
    // bawah benar-benar membuktikan handler-nya jalan, bukan cuma kebetulan
    // sama dengan initial state.
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    expect(result.current.wsStatus).toBe('live')

    await act(() => {
      fake.triggerManager('reconnect_failed')
    })

    expect(result.current.wsStatus).toBe('unavailable')
  })

  it('degrades live -> connecting on a non-self-initiated disconnect', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    expect(result.current.wsStatus).toBe('live')

    await act(() => {
      fake.trigger('disconnect', 'transport close')
    })
    expect(result.current.wsStatus).toBe('connecting')
  })

  it('ignores a self-initiated disconnect ("io client disconnect")', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { result, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    expect(result.current.wsStatus).toBe('live')

    await act(() => {
      fake.trigger('disconnect', 'io client disconnect')
    })
    expect(result.current.wsStatus).toBe('live')
  })

  it('reuses the same socket across a serverId change once already connected', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { rerender, act } = await renderHook(
      (props?: { serverId: string }) => useMonitoringSocket(props?.serverId ?? null, true),
      { initialProps: { serverId: 'srv-1' } }
    )
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })
    fake.emit.mockClear()

    await rerender({ serverId: 'srv-2' })

    expect(io).toHaveBeenCalledTimes(1) // socket tidak dibuat ulang
    expect(fake.emit).toHaveBeenCalledWith('unsubscribe', { serverId: 'srv-1' })
    expect(fake.emit).toHaveBeenCalledWith('subscribe', { serverId: 'srv-2' }, expect.any(Function))
  })

  it('unsubscribes and disconnects on unmount', async () => {
    const fake = createFakeSocket()
    vi.mocked(io).mockReturnValue(fake)

    const { unmount, act } = await renderHook(() => useMonitoringSocket('srv-1', true))
    await act(() => {
      fake.connected = true
      fake.trigger('connect')
    })

    await unmount()

    expect(fake.emit).toHaveBeenCalledWith('unsubscribe', { serverId: 'srv-1' })
    expect(fake.disconnect).toHaveBeenCalled()
  })
})
