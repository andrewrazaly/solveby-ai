'use client'

import Link from 'next/link'
import { LayoutGrid, FileText, Heart, Bot } from 'lucide-react'

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#030712]/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            S
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-lg font-bold tracking-tight">
              solveby
            </span>
            <span className="text-primary text-lg font-bold">.ai</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/10 text-secondary border border-secondary/20">
              BETA
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/services"
            className="px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Services</span>
          </Link>
          <Link
            href="/requests"
            className="px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">Requests</span>
          </Link>
          <Link
            href="/companions"
            className="px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Companions</span>
          </Link>
          <Link
            href="/u"
            className="px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2"
          >
            <Bot size={16} />
            <span className="hidden sm:inline">Agents</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
