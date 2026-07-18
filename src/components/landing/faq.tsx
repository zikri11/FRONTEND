import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Apakah EgNET bisa digunakan untuk router selain MikroTik?",
    answer: "Saat ini, sistem kami secara spesifik didesain dengan integrasi tingkat tinggi untuk perangkat MikroTik, karena fitur-fitur seperti manajemen voucher dan pengaturan firewall membutuhkan kontrol API khusus. Namun, kami berencana untuk memperluas dukungan ke brand lain di masa depan.",
  },
  {
    question: "Apakah saya harus mengerti bahasa teknikal (IT) untuk menggunakan ini?",
    answer: "Tidak sama sekali! Untuk pemilik bisnis (Owner), kami menyediakan 'Owner Dashboard' yang menampilkan laporan performa secara ringkas dan berbahasa manusia dengan bantuan AI. Urusan teknis bisa Anda delegasikan sepenuhnya kepada teknisi melalui 'Technician Dashboard'.",
  },
  {
    question: "Bagaimana cara kerja AI Network Analysis di EgNET?",
    answer: "Sistem kami terus-menerus mengambil metrik kesehatan jaringan Anda. Saat ada anomali atau penurunan kecepatan, data ini dianalisis secara real-time oleh model AI (ChatGPT, Claude, Gemini, dll) untuk mencari akar masalah dan memberikan rekomendasi solusi instan.",
  },
  {
    question: "Apakah saya perlu server khusus di setiap cabang/outlet?",
    answer: "Tidak perlu. EgNET menggunakan teknologi cloud murni. Selama router MikroTik Anda di outlet terhubung ke internet, router tersebut dapat langsung disinkronkan ke dalam sistem cloud EgNET secara terpusat.",
  },
  {
    question: "Bagaimana jika jumlah voucher yang saya butuhkan melebihi limit Free Tier?",
    answer: "Jika bisnis Anda berkembang pesat, Anda bisa kapan saja beralih dari 'Free Tier' ke paket 'Net Junior' atau 'NetBis' yang menawarkan pembuatan voucher hotspot tanpa batas dan integrasi POS secara langsung.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative border-t [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center">
            <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-900),var(--color-indigo-600),var(--color-gray-700),var(--color-indigo-500),var(--color-gray-900))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-gray-600">
              Punya pertanyaan seputar EgNET? Temukan jawabannya di bawah ini.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "rounded-2xl border transition-colors",
                    openIndex === index ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <button
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    onClick={() => toggleOpen(index)}
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-indigo-500 transition-transform duration-200",
                        openIndex === index ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-200 ease-in-out",
                      openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-5 text-gray-600">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
