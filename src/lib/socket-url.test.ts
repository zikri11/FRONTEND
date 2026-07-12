import { describe, expect, it, vi } from 'vitest'
import { getSocketOrigin } from './socket-url'

describe('getSocketOrigin', () => {
  it('strips /api suffix from an absolute VITE_API_BASE_URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4000/api')
    expect(getSocketOrigin()).toBe('http://localhost:4000')
  })

  it('strips /api suffix regardless of trailing slash', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.egnet.id/api/')
    expect(getSocketOrigin()).toBe('https://api.egnet.id')
  })

  it('falls back to window.location.origin for a relative base URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', '/api')
    expect(getSocketOrigin()).toBe(window.location.origin)
  })

  it('falls back to window.location.origin when env var is unset', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    expect(getSocketOrigin()).toBe(window.location.origin)
  })
})
