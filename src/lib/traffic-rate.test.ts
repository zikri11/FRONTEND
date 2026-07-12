import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeTrafficRate } from './traffic-rate'
import type { TrafficInterface } from '@/features/dashboard/components/router-health-panel'

function iface(rxByte: number, txByte: number): TrafficInterface {
  return { id: 'ether1', name: 'ether1', rxByte, txByte, running: true }
}

describe('computeTrafficRate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null on the first tick for a server (no prior delta)', () => {
    expect(computeTrafficRate('srv-1', [iface(1000, 500)])).toBeNull()
  })

  it('computes bits/sec from the delta between two ticks', () => {
    computeTrafficRate('srv-2', [iface(1000, 500)])
    vi.setSystemTime(1000) // +1s
    const rate = computeTrafficRate('srv-2', [iface(2000, 1500)])
    expect(rate).toEqual({ rx: 8000, tx: 8000 }) // (1000 bytes * 8) / 1s
  })

  it('clamps to 0 when counters reset (router reboot)', () => {
    computeTrafficRate('srv-3', [iface(5000, 5000)])
    vi.setSystemTime(1000)
    const rate = computeTrafficRate('srv-3', [iface(100, 100)])
    expect(rate).toEqual({ rx: 0, tx: 0 })
  })

  it('returns null and clears state when traffic list is empty', () => {
    computeTrafficRate('srv-4', [iface(1000, 500)])
    vi.setSystemTime(1000)
    expect(computeTrafficRate('srv-4', [])).toBeNull()
    // state cleared → next non-empty call is treated as a fresh first tick
    vi.setSystemTime(2000)
    expect(computeTrafficRate('srv-4', [iface(2000, 1000)])).toBeNull()
  })

  it('sums rxByte/txByte across multiple interfaces', () => {
    computeTrafficRate('srv-5', [iface(1000, 500), iface(2000, 1000)])
    vi.setSystemTime(1000)
    const rate = computeTrafficRate('srv-5', [iface(1500, 700), iface(2500, 1300)])
    // rx delta = (1500-1000)+(2500-2000) = 1000 bytes → 8000 bits/s
    // tx delta = (700-500)+(1300-1000) = 500 bytes → 4000 bits/s
    expect(rate).toEqual({ rx: 8000, tx: 4000 })
  })
})
