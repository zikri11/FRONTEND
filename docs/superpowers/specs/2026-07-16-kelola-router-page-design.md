# Desain — Halaman "Kelola Router" `/routers` (SUPER_ADMIN)

**Tanggal:** 2026-07-16 · **Referensi:** `DESIGN-vercel.md` · `typography-improvement-plan.md`
**Scope:** SA-only, dummy. Path `/routers` — TIDAK menyentuh `/servers` (halaman teknisi).

## Keputusan (QnA)

| Keputusan | Pilihan |
|---|---|
| Scope | SA, seluruh router lintas tenant |
| Kolom | 5 inti: Router (nama + host:port), Owner, Status, Protokol, Terakhir Dicek — tanpa hotspotName/dnsName/createdAt (detail nanti), tanpa id/username/password (kredensial) |
| Fitur | Search (nama/owner/host) + filter Status + page size + prev/next; TANPA kolom Aksi (SA memantau saja) |

## Route & navigasi

- `src/routes/_authenticated/routers/index.tsx` — guard `role !== 'SUPER_ADMIN'` → redirect `/`.
- Sidebar: "Kelola Router" (ikon Router) setelah Kelola Plan, SA-only (filter existing).

## Data — `src/features/routers/data/dummy-routers.ts`

Generator deterministik ±40 router; nama owner impor dari `DUMMY_OWNERS`
(features/owners) agar konsisten. Field: id, name ("Router Outlet N"), host
(`192.168.{x}.{y}`), port (8728 / 8729 bila SSL), useSSL rotasi, ownerName,
lastStatus rotasi (mayoritas ONLINE, sebagian OFFLINE/UNKNOWN), lastCheckedAt
("d MMM yyyy, HH:mm" atau null → "—").

## Halaman — `src/features/routers/index.tsx` (pola /pos-transactions)

- H1 "Kelola Router" + deskripsi "Seluruh router yang terdaftar di platform, semua tenant."
- Toolbar: search debounce 300ms (name/owner/host) + Select Status
  (Semua/Online/Offline/Unknown, `sm:w-[160px]`).
- Tabel standar fasetabel (card `py-0` + `CardContent px-0`):
  | Kolom | Style |
  |---|---|
  | Router (`ps-4`) | nama `text-sm` ink + baris 2 `host:port` `font-mono text-xs muted` (pola /servers tanpa ikon) |
  | Owner | `text-sm text-muted-foreground` |
  | Status | badge pola /servers: ONLINE success soft · OFFLINE secondary muted · UNKNOWN warning soft |
  | Protokol | Badge secondary + ShieldCheck "HTTPS / SSL" / ShieldAlert "HTTP" |
  | Terakhir Dicek (`pe-4` kanan) | mono muted `tabular-nums`; "—" bila null |
- Footer paginasi standar 10/25/50/100; empty state colSpan 5.

## Backend (dicatat)

`GET /servers` scope SA sudah global (`serverScopeWhere` SA = `{}`) — wiring tinggal
sambung + sertakan nama owner (relasi User) di response.

## Verifikasi

`vite build` + `tsc` + eslint bersih; SA: sidebar Kelola Router, search/filter/paginasi
jalan; non-SA: redirect + tanpa menu; `/servers` teknisi tak berubah.
