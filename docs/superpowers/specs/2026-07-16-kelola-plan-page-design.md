# Desain — Halaman "Kelola Plan" `/plans` (SUPER_ADMIN)

**Tanggal:** 2026-07-16 · **Referensi:** `DESIGN-vercel.md` · `typography-improvement-plan.md`
Mockup dari user (tabel plan + form buat/edit + preview card). Dummy, state lokal.

## Route & navigasi

- `src/routes/_authenticated/plans/index.tsx` — guard SA-only, komponen `KelolaPlan`
  (`src/features/plans/index.tsx`).
- Sidebar: "Kelola Plan" (ikon Layers) setelah Kelola Owner, SA-only (filter existing).

## Susunan halaman (shell standar + `outerBoxClass`)

1. **H1** "Kelola Plan" + deskripsi muted.
2. **Section Daftar Plan**: judul `text-base font-semibold` + Button "+ Tambah Plan"
   kanan (reset form). Tabel standar fasetabel (card `py-0`+`CardContent px-0`):
   Nama (ps-4 ink) · Router · Teknisi (rata kanan tabular) · AI (badge Aktif
   `success-light` / Nonaktif `secondary` muted) · Masa ("30 hari") · Harga (mono
   tabular kanan) · Aksi (pe-4, dropdown ⋯ Edit/Hapus + AlertDialog).
3. **Card "Buat / Edit Plan"**: form dummy — Nama (Input), grid 2 kolom: Maks Router
   (Input number + "unit"), Maks Teknisi (+ "orang"), Akses AI (RadioGroup
   Aktif/Nonaktif), Masa Berlaku (Input number + "hari"); Harga (Rp Input number +
   Select periode Bulan/Tahun). Footer: Batal (reset) + Simpan Plan (tambah/update
   state + toast). Judul card berubah "Edit Plan — {nama}" saat mode edit.
4. **Card "Preview tampilan ke user"**: mini plan card (max-w-xs, `nestedCardClass`)
   live dari form: nama, "Rp{harga} / bulan", separator, daftar ✓ (Router, Teknisi,
   Akses AI bila aktif), caption "Aktif {N} hari", Button "Pilih Plan" (visual saja).

## Data dummy awal

Konsisten dengan seluruh app (bukan contoh mockup Basic/Enterprise):
Free 5 router/2 teknisi/AI ✕/30 hari/Rp 0 · Standard 25/10/AI ✓/30 hari/Rp 149.000 ·
Pro 100/50/AI ✓/30 hari/Rp 299.000.

## Backend (dicatat)

Backend baru punya Plan {code FREE/STANDARD, maxRouters, price, durationDays} —
field maxTechnicians, maxApiKeys/AI access, tier PRO = kebutuhan baru. CRUD plan
endpoint belum ada.

## Verifikasi

`vite build` (route baru) + `tsc` + eslint bersih; SA: sidebar Kelola Plan, tambah/
edit/hapus mengubah tabel + preview live; non-SA: redirect + tanpa menu.
