# Desain — Tab Analytics OWNER: Status Outlet (Uptime Timeline)

**Tanggal:** 2026-07-15
**Referensi desain:** `DESIGN-vercel.md` · `desain/typography-improvement-plan.md`
**Scope:** dashboard `/dashboard` tab Analytics, hanya OWNER. Dummy data.

## Ringkasan

Isi tab Analytics untuk OWNER diganti seluruhnya: dari template shadcn-admin
(clicks/visitors/bounce/referrers/devices) menjadi **Status Outlet** — ringkasan +
uptime timeline 30 hari semua outlet, pola visual sama dengan halaman `/monitoring`.
TEKNISI/SUPER_ADMIN tetap melihat `Analytics` lama (tak disentuh).

Timeline BUKAN chart library — deretan 30 balok div (1 balok = 1 hari, hijau normal /
merah ada downtime, tooltip tanggal + durasi), pola "status page".

## Keputusan (hasil QnA)

| Keputusan | Pilihan |
|---|---|
| Scope tab | Rombak seluruh isi tab (bukan cuma card Traffic Overview) |
| Scope role | OWNER saja; role lain tetap `Analytics` template lama |
| Nama outlet | 3 outlet POS (`POS_OUTLETS`): Outlet Pusat, Cabang A, Cabang B |
| Bentuk timeline | Balok status 30 hari (bukan bar chart XY), tooltip per hari |

## 1. Komponen baru — `src/features/dashboard/components/outlet-status-overview.tsx`

Export `OutletStatusOverview`. Struktur:

### 1a. Baris ringkasan — 3 kartu (`nestedCardClass`, pola kartu statistik overview)

| Kartu | Nilai dummy | Caption |
|---|---|---|
| Outlet Online | `2/3` | "outlet aktif saat ini" |
| Availability 30 Hari | `99.54%` | "rata-rata semua outlet" |
| Total Downtime 30 Hari | `3 jam 26 menit` | "gabungan semua outlet" |

Angka: `text-2xl font-semibold tracking-tight tabular-nums`; title `text-sm
font-medium`; ikon svg `h-4 w-4 text-muted-foreground` (pola kartu existing).
Nilai ringkasan harus konsisten dengan data dummy per-outlet (§3).

### 1b. Card "Status Outlet" (`nestedCardClass`)

- Header: `CardTitle` "Status Outlet" + `CardDescription` "Uptime 30 hari terakhir
  semua outlet" + link kecil kanan **"Lihat detail →"** ke `/monitoring`
  (`text-sm text-muted-foreground hover:text-foreground`, TanStack `Link`).
- Tabel (pola `/monitoring`): kolom **Outlet · Status · Availability ·
  Timeline (30 Hari) · Terakhir Offline**.
  - Header kolom: `text-xs font-medium tracking-wide text-muted-foreground`
    (tanpa uppercase), header row `hover:bg-transparent`.
  - Status: pulse dot `bg-success` "Online" / `bg-destructive` "Offline"
    (persis markup /monitoring), teks `text-sm font-medium`.
  - Availability: `font-mono text-sm tabular-nums`.
  - Timeline: 30 balok `flex-1 h-6 rounded-[2px] gap-[2px]`, warna
    `bg-success/80` / `bg-destructive/80`, Tooltip per balok:
    tanggal (`d MMM yyyy`) + "Tidak ada downtime" / "Downtime: X menit".
  - Terakhir Offline: `text-sm text-muted-foreground`; "—" bila tak pernah,
    "Sedang offline" bila masih down.
- Footer card: legend + orientasi waktu, `text-[11px] text-muted-foreground`:
  kotak 8px `bg-success/80` "Normal" · kotak `bg-destructive/80` "Ada downtime" ·
  kanan: "30 hari lalu → Hari ini".

## 2. Integrasi — `src/features/dashboard/index.tsx`

`TabsContent value='analytics'`: `{isOwner ? <OutletStatusOverview /> : <Analytics />}`.
Import ditambah; `analytics.tsx` tidak diubah.

## 3. Data dummy — di file komponen (module-level, deterministik)

Tanggal dihitung mundur dari konstanta `TODAY = new Date(2026, 6, 14)` (statis, bukan
`new Date()` — konsisten dengan dummy lain). Nama outlet impor `POS_OUTLETS`.

| Outlet | Status | Availability | Downtime (indeks hari ke-, 0 = 30 hari lalu) | Terakhir Offline |
|---|---|---|---|---|
| Outlet Pusat | Online | 99.98% | hari ke-15 = 29 Jun (4 menit) dan ke-25 = 10 Jul (6 menit) | 10 Jul 2026, 10:52 (6 menit) |
| Outlet Cabang A | Online | 100% | — | — |
| Outlet Cabang B | Offline | 98.64% | hari 27–29 (3 jam 16 menit total, hari terakhir masih down) | Sedang offline |

Ringkasan (§1a) diturunkan dari tabel ini: online 2/3; availability rata-rata
(99.98 + 100 + 98.64) / 3 ≈ 99.54%; total downtime ≈ 3 jam 26 menit.

Tipe:
```ts
type OutletUptime = {
  name: string
  status: 'online' | 'offline'
  availability: string // "99.98%"
  lastOffline: string | null // null → "—"
  days: { date: string; downtimeMinutes: number }[] // 30 item, index 0 = terlama
}
```

## 4. Di luar scope

- Halaman `/monitoring` tidak diubah (nama outlet 5 kota di sana menyusul).
- Wiring backend (butuh histori status router — belum ada endpoint; monitoring
  backend realtime-only, lihat spec ARSITEKTUR §10).
- Entri sidebar untuk `/monitoring`.
- Tab Reports/Notifications (tetap disabled).

## 5. Verifikasi

1. `npx tsc -b` + `npx eslint` file baru + `index.tsx` bersih.
2. Visual owner: tab Analytics → 3 kartu ringkasan + tabel 3 outlet + timeline +
   tooltip + legend; link "Lihat detail" → `/monitoring`; light + dark mode.
3. TEKNISI: tab Analytics tetap template lama.
