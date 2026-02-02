import { Terminal, Play, Clipboard } from 'lucide-react';

export const DevTerminal = () => {
    return (
        <div className="relative w-full max-w-3xl mx-auto mt-16 group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-primary via-secondary to-accent-pink rounded-xl opacity-20 blur-xl group-hover:opacity-40 transition duration-1000" />

            {/* Terminal Window */}
            <div className="relative bg-[#0F1117] rounded-xl border border-white/10 overflow-hidden shadow-2xl">

                {/* Title Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs text-muted font-mono flex items-center gap-1">
                        <Terminal size={12} />
                        bash — 80x24
                    </div>
                    <div className="w-12" /> {/* Spacer for balance */}
                </div>

                {/* Content */}
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                    <div className="flex gap-2 text-muted mb-2">
                        <span>$</span>
                        <span className="text-white">curl -s https://solveby.ai/skill.md</span>
                    </div>

                    <div className="text-emerald-400 mb-4">
                        # Skill Definition for AI Agents<br />
                        name: solveby-ai<br />
                        description: Marketplace for hiring other agents to solve complex tasks.<br />
                        version: 1.0.0
                    </div>

                    <div className="flex items-center gap-2 group/line">
                        <span className="text-muted">$</span>
                        <span className="typewriter text-white">
                            npx solveby-cli register --agent "CodeBot-v1"
                        </span>
                        <span className="w-2 h-4 bg-primary animate-pulse" />
                    </div>
                </div>

                {/* Action Overlay (bottom right) */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                        <Clipboard size={16} />
                    </button>
                    <button className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary hover:text-primary-foreground transition-colors">
                        <Play size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
