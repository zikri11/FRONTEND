# Spec — Overlay Loading Saat Ganti Router (Dashboard/Profiles/Vouchers)

**Tanggal:** 2026-07-12
**Konteks:** dropdown "Pilih Router" (`team-switcher.tsx`, set `activeServerId` di `useServerStore`) sudah bikin data `/dashboard`, `/profiles`, `/vouchers` reactive otomatis (queryKey React Query include `activeServerId`) — dikonfirmasi lewat investigasi kode, bukan asumsi. Yang belum ada: indikator visual "sedang reload" saat ganti ke router yang belum pernah dibuka sesi ini. User minta spinner overlay pakai `pnpm dlx shadcn@latest add @reui/c-spinner-7`.

---

## 1. Tujuan

- Tampilkan overlay spinner di `/dashboard`, `/profiles`, `/vouchers` selama data router yang baru dipilih belum pernah di-fetch sesi ini.
- Tidak menambah logic tracking baru — reuse `isPending` React Query yang sudah ada per halaman.
- Konsisten: satu komponen overlay reusable, bukan hand-roll per halaman.

## 2. Di luar cakupan

- **`/servers`** — halaman ini menampilkan SEMUA router milik owner, tidak difilter per-`activeServerId` (by design, dikonfirmasi kode: `fetchServers()` hit `/servers` tanpa param filter). Ganti router tidak mengubah data halaman ini → tidak butuh overlay. (Keputusan user: dikeluarkan dari scope.)
- Balik ke router yang sudah pernah dibuka sesi ini → data cache tampil instan, **tidak** ada overlay (bukan bug, sesuai perilaku default React Query yang dipilih user).
- Tidak mengubah struktur/layout halaman — hanya menambah lapisan overlay + menghapus baris teks loading lama.

## 3. Komponen baru: `RouterLoadingOverlay`

`src/components/router-loading-overlay.tsx` — reuse pattern `c-spinner-7` (sudah ter-install: `src/components/ui/spinner.tsx`, contoh di `src/components/examples/c-spinner-7.tsx`).

```tsx
import { Spinner } from '@/components/ui/spinner'

export function RouterLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-xs">
      <Spinner className="size-6 opacity-60" />
      <span className="text-sm text-muted-foreground">Memuat data router...</span>
    </div>
  )
}
```

Parent wrapper wajib `relative` (Tailwind `relative` class) supaya `absolute inset-0` overlay pas menutupi area yang dituju, bukan seluruh viewport.

## 4. Wiring per halaman

### 4.1 Dashboard (`src/features/dashboard/index.tsx`)

Sinyal loading gabungan (WS + REST + OWNER, tidak bisa pakai `isPending` REST mentah karena query REST sengaja `enabled: false` selama WS `live` — kalau dipakai mentah akan `isPending=true` permanen untuk TEKNISI setelah WS ambil alih):

```ts
const dashboardIsLoading = (isOwner || wsResult.wsStatus !== 'live')
  ? isPending
  : false
```

Area yang di-overlay: div pembungkus grid kartu (`User Aktif`/`Voucher`) + `RouterHealthPanel` + kartu `Pengguna Aktif` — **bukan** header halaman/tombol Sinkron/TabsList (biar chrome halaman tetap terlihat/interaktif). Bungkus `TabsContent value='overview'` dengan `relative`, taruh `<RouterLoadingOverlay show={dashboardIsLoading} />` sebagai child pertama.

### 4.2 Profiles (`src/features/profiles/index.tsx`)

Sinyal: `isPending` (query utama, sudah ada).
Area: **hanya** div tabel (`overflow-hidden rounded-xl border ${nestedCardClass}`) — bukan seluruh `outerBoxClass` div. Header lokal (judul "Profil Hotspot" + tombol Sinkron/Buat Profil) **tetap terlihat & interaktif** saat loading, konsisten dengan Dashboard (§4.1) yang juga exclude header/chrome dari overlay. Tambah `relative` ke className div tabel, taruh overlay sebagai child pertama di dalamnya.
Hapus branch `isPending ? <TableRow>...Memuat data profil...</TableRow>` di `<TableBody>` (redundant, ketutup overlay).

### 4.3 Vouchers (`src/features/vouchers/index.tsx`)

Sinyal: `isPending` dari query utama (`vouchersResponse`) — query pendukung (profiles filter, unusedVouchers, usedVouchers count) tidak dijadikan sinyal terpisah (semuanya ikut pending bareng saat ganti ke router baru, jadi cukup satu sinyal).
Area: konten `TabsContent value='list'` (kartu ringkasan + toolbar search/filter + tabel) — bukan header lokal (judul + tombol Sinkron/Buat Voucher) atau `TabsList`, sama prinsip dengan §4.1/§4.2. Tambah `relative` ke className `TabsContent`, taruh overlay sebagai child pertama.
Hapus branch `isPending ? <TableRow>...Memuat data voucher...</TableRow>` di `<TableBody>`.

## 5. Edge case & perilaku yang disengaja

- **Overlay nutup konten sepenuhnya** (`bg-background/80` + `backdrop-blur-xs`) — state "empty"/data lama di baliknya boleh sempat ke-render tapi tidak terlihat user (hidden behind overlay), jadi aman menghapus branch teks loading lama tanpa flash yang salah.
- **OWNER di Dashboard**: `wsResult.wsStatus` akan selalu `'unavailable'` (hook di-disable via `enabled=!isOwner`), jadi rumus `dashboardIsLoading` otomatis jatuh ke `isPending` REST biasa — perilaku sama seperti TEKNISI saat WS belum/tidak nyambung.
- **Polling 3 detik** (`refetchInterval`) tidak memicu overlay berulang — `isPending` hanya true di fetch PERTAMA untuk suatu queryKey, refetch berkala berikutnya pakai `isFetching` (bukan `isPending`) yang tidak kita pakai sebagai sinyal.
- **Ganti router cepat berkali-kali**: `signal` (AbortSignal) yang sudah dipakai di semua queryFn (Profiles sudah punya komentar soal ini) tetap membatalkan request basi — tidak berubah oleh perubahan ini.

## 6. Testing

- Overlay adalah komponen presentasional murni (`show: boolean` → render/tidak) — tidak perlu unit test terpisah (konvensi repo: komponen kartu/panel presentasional tidak di-unit-test, lihat `recent-sales.tsx`).
- `dashboardIsLoading` adalah ekspresi turunan dari state yang sudah di-test tidak langsung (tidak perlu test baru) — cukup verifikasi manual.
- Verifikasi manual (checklist):
  1. Login TEKNISI, buka `/dashboard` dengan 2+ router. Pilih router yang belum pernah dibuka sesi ini → overlay muncul sampai data pertama datang (WS snapshot atau REST).
  2. Balik ke router yang sudah pernah dibuka → **tidak** ada overlay, data lama langsung tampil (lalu diam-diam refresh).
  3. Ulangi 1-2 di `/profiles` dan `/vouchers`.
  4. Login OWNER, ulangi di `/dashboard` (read-only, WS tidak pernah connect) — overlay tetap muncul di kunjungan pertama ke suatu router.
  5. `/servers` — ganti router, pastikan TIDAK ada overlay (halaman ini tidak reactive, sesuai desain).

## 7. File yang berubah

- Baru: `src/components/router-loading-overlay.tsx`
- Sudah ter-install (task sebelumnya): `src/components/ui/spinner.tsx`, `src/components/examples/c-spinner-7.tsx` (referensi pattern, tidak dipakai langsung di produksi)
- Ubah: `src/features/dashboard/index.tsx`, `src/features/profiles/index.tsx`, `src/features/vouchers/index.tsx`
