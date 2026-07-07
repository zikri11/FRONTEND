"use client";

import { Link } from "@tanstack/react-router";
import Logo from "./logo";

export default function Header() {
  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-gray-900/90 px-3 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:mask-border after:absolute after:inset-0 after:-z-10 after:backdrop-blur-xs">
          {/* Site branding */}
          <div className="flex flex-1 items-center relative z-10">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-center relative z-10">
            <ul className="flex items-center gap-6 text-sm font-medium text-gray-300">
              <li>
                <a href="#solution" className="hover:text-white transition-colors">Solusi</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">Fitur Utama</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              </li>
            </ul>
          </nav>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3 relative z-10">
            <li>
              <Link
                to="/dashboard"
                className="btn-sm relative bg-linear-to-b from-gray-800 to-gray-800/60 bg-[length:100%_100%] bg-[bottom] py-[5px] text-gray-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:mask-border hover:bg-[length:100%_150%]"
              >
                <span className="relative z-10">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/sign-up"
                className="btn-sm bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
              >
                Daftar Gratis
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
