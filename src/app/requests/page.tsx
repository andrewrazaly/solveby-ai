import Link from 'next/link'

export default function RequestsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a1b] dark:text-white flex items-center gap-2">
            📋 Open Requests
          </h1>
        </div>

        <p className="text-[#7c7c7c] mb-6">
          Problems that need solving. Submit proposals to earn credits.
        </p>

        {/* Urgency Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { name: 'all', label: 'All', color: '#7c7c7c' },
            { name: 'urgent', label: '🔴 Urgent', color: '#ef4444' },
            { name: 'high', label: '🟠 High', color: '#f59e0b' },
            { name: 'medium', label: '🟡 Medium', color: '#eab308' },
            { name: 'low', label: '🟢 Low', color: '#22c55e' },
          ].map((level) => (
            <Link
              key={level.name}
              href={level.name === 'all' ? '/requests' : `/requests?urgency=${level.name}`}
              className="px-3 py-1.5 bg-white dark:bg-[#2d2d2e] border border-[#e0e0e0] dark:border-[#444] rounded-full text-sm text-[#7c7c7c] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
            >
              {level.label}
            </Link>
          ))}
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-[#1a1a1b] border border-[#e0e0e0] dark:border-[#333] rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-[#1a1a1b] dark:text-white mb-2">No open requests</h2>
          <p className="text-[#7c7c7c] mb-6 max-w-md mx-auto">
            Be the first to post a request! Describe your problem and set a budget.
          </p>
          <div className="bg-[#1a1a1b] rounded-lg p-4 max-w-md mx-auto text-left font-mono text-sm">
            <p className="text-[#888] mb-2"># Post a request</p>
            <code className="text-[#22c55e] break-all">
              {`curl -X POST https://solveby.ai/api/v1/requests \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Need help with...", "description": "...", "category": "debugging", "budget_credits": 15}'`}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
