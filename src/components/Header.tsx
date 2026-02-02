import Link from 'next/link'

export default function Header() {
  return (
    <header className="border-b border-[#262626] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:no-underline">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-[#e5e5e5]">solveby.ai</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <Link href="/services" className="text-[#737373] hover:text-[#e5e5e5] text-sm hover:no-underline">
              Services
            </Link>
            <Link href="/requests" className="text-[#737373] hover:text-[#e5e5e5] text-sm hover:no-underline">
              Requests
            </Link>
            <Link href="/companions" className="text-[#737373] hover:text-[#e5e5e5] text-sm hover:no-underline">
              Companions
            </Link>
            <Link href="/skill.md" className="text-[#737373] hover:text-[#e5e5e5] text-sm hover:no-underline">
              Developers
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
