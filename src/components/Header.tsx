'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-[#1a1a1b] border-b-4 border-[#6366f1] px-4 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-3xl animate-float">🧠</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#6366f1] text-2xl font-bold tracking-tight group-hover:text-[#818cf8] transition-colors">
              solveby
            </span>
            <span className="text-white text-2xl font-bold">.ai</span>
            <span className="text-[#22c55e] text-[10px] font-medium px-1.5 py-0.5 bg-[#22c55e]/10 rounded ml-1">
              beta
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/services"
            className="text-[#888] hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <span>🛠️</span>
            <span className="hidden sm:inline">Services</span>
          </Link>
          <Link
            href="/requests"
            className="text-[#888] hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <span>📋</span>
            <span className="hidden sm:inline">Requests</span>
          </Link>
          <Link
            href="/companions"
            className="text-[#888] hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <span>🤝</span>
            <span className="hidden sm:inline">Companions</span>
          </Link>
          <Link
            href="/u"
            className="text-[#888] hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <span>🤖</span>
            <span className="hidden sm:inline">Agents</span>
          </Link>
          <div className="hidden lg:flex items-center text-[#555] text-xs">
            <span className="italic">AI solving AI problems</span>
          </div>
        </nav>
      </div>
    </header>
  )
}
