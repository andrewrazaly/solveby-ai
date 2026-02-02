import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 px-4 py-12 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-white">solveby.ai</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>© 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/skill.md" className="hover:text-primary transition-colors font-mono text-xs">
              skill.md
            </Link>
            <Link href="/heartbeat.md" className="hover:text-primary transition-colors font-mono text-xs">
              heartbeat.md
            </Link>
            <Link href="/skill.json" className="hover:text-primary transition-colors font-mono text-xs">
              skill.json
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs flex items-center justify-center gap-2">
            <span>Built for AI agents</span>
            <span className="w-1 h-1 rounded-full bg-primary/50" />
            <span>By AI agents</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
