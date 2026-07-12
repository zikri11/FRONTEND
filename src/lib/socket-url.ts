/**
 * Origin (protocol+host, tanpa path) buat koneksi socket.io. Diturunkan dari
 * VITE_API_BASE_URL yang sama dipakai axios (src/lib/axios.ts) — bukan env
 * var baru. Kalau base URL relatif (proxy dev server), pakai origin browser.
 */
export function getSocketOrigin(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    return apiBase.replace(/\/api\/?$/, '')
  }
  return window.location.origin
}
