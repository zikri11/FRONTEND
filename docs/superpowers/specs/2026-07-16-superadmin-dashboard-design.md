# Desain — Dashboard SUPER_ADMIN (Platform-Level, Lepas dari Router Terpilih)

**Tanggal:** 2026-07-16
**Referensi desain:** `DESIGN-vercel.md` · `desain/typography-improvement-plan.md`
**Scope:** `src/features/dashboard/index.tsx` + 2 komponen baru. Dummy data.
Branch OWNER & TEKNISI tidak berubah.

## Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Scope role | Branch ke-3 khusus SUPER_ADMIN; owner/teknisi utuh |
| Subline kartu | Delta badge dummy (pola kartu owner) |
| Keterikatan router | SA TIDAK terikat "router terpilih" — dashboard selalu render (pola owner DB-only) |
| Baris bawah | Ganti platform-level: Aktivitas Platform Terbaru + Router Bermasalah |

## 1. Lepas dari router terpilih (`dashboard/index.tsx`)

- `const isSuperAdmin = role === 'SUPER_ADMIN'`.
- WS monitoring: `useMonitoringSocket(activeServerId, !isOwner && !isSuperAdmin)` —
  hanya TEKNISI yang pakai WS.
- Query `dashboard-metrics`: `enabled: !!activeServerId && !isOwner && !isSuperAdmin
  && wsStatus === 'unavailable'`.
- Query voucher counts (2): `enabled: !!activeServerId && !isSuperAdmin` (kartu SA
  dummy, tak butuh).
- `dashboardIsLoading`: SA → false (jebakan isPending query disabled, sama seperti owner).
- Gate render: `EmptyRouterPlaceholder` / `isNotFound` / `isDisconnected` di-skip untuk
  SA (kondisi metrics default false otomatis; EmptyRouterPlaceholder perlu guard
  eksplisit: `!isLoading && !activeServerId && !isSuperAdmin`... owner masih pakai gate
  itu — SA tidak).
- Tombol **Sinkron**: `{!isOwner && !isSuperAdmin && …}`.

## 2. Kartu statistik SA — 4 kartu (grid `sm:grid-cols-2 xl:grid-cols-4`)

Pola persis kartu owner (title 14/500, angka `text-2xl font-semibold tracking-tight
tabular-nums`, ikon svg `h-4 w-4 text-muted-foreground`, delta badge `size='sm'` +
teks muted):

| Kartu | Ikon (lucide path inline) | Angka | Delta |
|---|---|---|---|
| Total User | Users | `128` | `success-light` ↗ `+12` · "user baru bulan ini" |
| Total Teknisi | Wrench | `47` | `success-light` ↗ `+5` · "teknisi baru bulan ini" |
| Total Router | Router | `86` | `success-light` ↗ `+3` · "router terhubung minggu ini" |
| Total Transaksi POS | ReceiptText | `1.204` | `success-light` ↗ `+140` · "lebih banyak dari minggu kemarin" |

Tak clickable (halaman lintas-tenant belum ada; `/pos-transactions` guard owner-only).

## 3. Baris bawah SA (grid `grid-cols-1 lg:grid-cols-7`, dummy)

### 3a. "Aktivitas Platform Terbaru" (col-span-4, komponen baru `platform-activity.tsx`)

Card `nestedCardClass` + `CardHeader` (title + description "Aktivitas terbaru dari
seluruh tenant"). Tabel standar fasetabel:

| Kolom | Style |
|---|---|
| Waktu | `font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap` |
| Aksi | Badge `success-light`/`destructive-light`/`info-light` (mapping activity) |
| Deskripsi | `text-sm text-foreground` |
| Owner (kanan) | `text-sm text-muted-foreground text-right` |

8 baris dummy (mis. VOUCHER_CREATED, SERVER_ADDED, POS_VOUCHER_GENERATED,
LOGIN_FAILED, dsb. dengan owner FnB fiktif). Wiring nanti: `GET /activity-log`
(SA memang global).

### 3b. "Router Bermasalah" (col-span-3, komponen baru `problem-routers.tsx`)

Card `nestedCardClass`. List router offline lintas tenant, tiap baris:
- Kiri: nama router (`text-sm text-foreground`) + owner (`text-xs text-muted-foreground`).
- Kanan: badge Offline (`variant='secondary' text-muted-foreground` — pola /servers)
  + "offline sejak 2 jam lalu" (`text-xs text-muted-foreground`).

Dummy 3 router offline. Empty state: teks muted "Semua router online." + badge
success-light "OK".

## 4. Tetap / di luar scope

- Tab Analytics SA: template lama (fase lanjut: monitoring platform).
- Branch OWNER & TEKNISI: tidak disentuh.
- Kebutuhan backend (dicatat): endpoint agregat platform (count user/teknisi/router/
  transaksi + delta periode), status router global lintas tenant.

## 5. Verifikasi

1. `npx tsc -b` + eslint file tersentuh bersih.
2. Login SUPER_ADMIN tanpa memilih router → dashboard langsung render: 4 kartu + 2 card
   bawah; tanpa gate "pilih router", tanpa placeholder terputus, tanpa tombol Sinkron;
   tab Network tanpa request `/monitoring/*` & `/vouchers`.
3. Login TEKNISI → perilaku lama utuh (WS, panel router, placeholder).
4. Login OWNER → dashboard owner utuh.
