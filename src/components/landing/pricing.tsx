import { CheckCircle2 } from "lucide-react";

export default function Pricing() {
  return (
    <section id="pricing" className="relative border-t [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                Investasi Bisnis
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Pilih Paket Anda
            </h2>
            <p className="text-lg text-indigo-200/65">
              Pilih paket yang paling sesuai dengan kebutuhan dan skala jaringan outlet Anda. 
              Mulai gratis, tingkatkan kapan saja.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid gap-6 md:grid-cols-3 max-w-sm md:max-w-none mx-auto">
            {/* Free Tier */}
            <div className="relative flex flex-col h-full rounded-2xl bg-gray-800 p-px overflow-hidden group">
              <div className="relative flex flex-col h-full rounded-[inherit] bg-gray-950 p-8 z-20">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-200">Free Tier</h3>
                  <div className="mt-2 text-indigo-200/65 text-sm">Untuk uji coba jaringan kecil.</div>
                </div>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-200">Rp 0</span>
                  <span className="text-indigo-200/65 text-sm">/ bulan</span>
                </div>
                <ul className="mb-8 flex flex-col gap-3 grow text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Maksimal 1 Router</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Dashboard Basic</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Analisis AI Standar (Harian)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Maksimal 50 Voucher / bulan</span>
                  </li>
                </ul>
                <a
                  href="#0"
                  className="btn w-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200"
                >
                  Mulai Gratis
                </a>
              </div>
            </div>

            {/* Net Junior */}
            <div className="relative flex flex-col h-full rounded-2xl bg-indigo-500 p-px overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-linear-to-b from-indigo-500 to-transparent opacity-20 pointer-events-none" />
              <div className="relative flex flex-col h-full rounded-[inherit] bg-gray-900 p-8 z-20 shadow-2xl">
                <div className="absolute top-0 right-0 -mr-2 -mt-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                    Terpopuler
                  </span>
                </div>
                <div className="mb-4 mt-2">
                  <h3 className="text-xl font-semibold text-gray-200">Net Junior</h3>
                  <div className="mt-2 text-indigo-200/65 text-sm">Untuk bisnis FnB menengah.</div>
                </div>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-200">Rp 199k</span>
                  <span className="text-indigo-200/65 text-sm">/ bulan</span>
                </div>
                <ul className="mb-8 flex flex-col gap-3 grow text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <span>Maksimal 3 Router</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <span>Dual Role Dashboard (Owner & Teknisi)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <span>Analisis AI Real-time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <span>Voucher Tanpa Batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <span>Support Prioritas</span>
                  </li>
                </ul>
                <a
                  href="#0"
                  className="btn w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)]"
                >
                  Pilih Net Junior
                </a>
              </div>
            </div>

            {/* NetBis */}
            <div className="relative flex flex-col h-full rounded-2xl bg-gray-800 p-px overflow-hidden group">
              <div className="relative flex flex-col h-full rounded-[inherit] bg-gray-950 p-8 z-20">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-200">NetBis</h3>
                  <div className="mt-2 text-indigo-200/65 text-sm">Untuk jaringan multi-outlet besar.</div>
                </div>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-200">Rp 499k</span>
                  <span className="text-indigo-200/65 text-sm">/ bulan</span>
                </div>
                <ul className="mb-8 flex flex-col gap-3 grow text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Router Tanpa Batas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Advanced Multi-Outlet Monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Integrasi API Langsung ke POS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Voucher & Hotspot Premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>Support VIP 24/7</span>
                  </li>
                </ul>
                <a
                  href="#0"
                  className="btn w-full bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200"
                >
                  Hubungi Sales
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
