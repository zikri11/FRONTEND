import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

// Harga sengaja TIDAK dipatok angka/paket spesifik — backend belum menyediakan
// endpoint paket publik. Blok fleksibel: komunikasikan nilai + skala, CTA daftar.
const points = [
  "Mulai gratis, tanpa kartu kredit",
  "Upgrade atau turun paket kapan saja",
  "Tanpa kontrak jangka panjang",
  "Skalabel dari 1 hingga banyak outlet",
  "Analisis AI & monitoring real-time",
  "Voucher hotspot & integrasi POS",
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative border-t [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-16">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-300/70 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-300/70">
              <span className="inline-flex bg-linear-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                Investasi Bisnis
              </span>
            </div>
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-900),var(--color-indigo-600),var(--color-gray-700),var(--color-indigo-500),var(--color-gray-900))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Harga Fleksibel Sesuai Skala Jaringan Anda
            </h2>
            <p className="text-lg text-gray-600">
              Tak perlu terpaku paket kaku. Bayar sesuai jumlah outlet dan fitur
              yang Anda butuhkan — mulai gratis, tingkatkan saat bisnis tumbuh.
            </p>
          </div>

          {/* Flexible panel */}
          <div className="mx-auto max-w-3xl" data-aos="fade-up">
            <div className="relative overflow-hidden rounded-2xl bg-indigo-500 p-px">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-indigo-500 to-transparent opacity-20" />
              <div className="relative z-20 rounded-[inherit] bg-white p-8 shadow-xl md:p-10">
                <ul className="grid gap-4 sm:grid-cols-2">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2.5 text-sm text-gray-700"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    to="/sign-up"
                    className="btn group w-full bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:w-auto"
                  >
                    <span className="relative inline-flex items-center">
                      Mulai Gratis
                      <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </Link>
                  <a
                    href="#faq"
                    className="btn relative w-full bg-linear-to-b from-gray-100 to-gray-200 bg-[length:100%_100%] bg-[bottom] text-gray-600 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-200),var(--color-gray-300),var(--color-gray-200))_border-box] before:mask-border hover:bg-[length:100%_150%] sm:w-auto"
                  >
                    Konsultasi Gratis
                  </a>
                </div>

                <p className="mt-5 text-center text-xs text-gray-500">
                  Tanpa kartu kredit · Batalkan kapan saja · Butuh paket khusus
                  multi-outlet? Hubungi kami.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
