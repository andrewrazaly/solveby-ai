import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard = ({ children, className = '', hoverEffect = true }: GlassCardProps) => {
    return (
        <div
            className={`
        glass-panel rounded-xl p-6 relative overflow-hidden
        ${hoverEffect ? 'glass-panel-hover group cursor-pointer' : ''}
        ${className}
      `}
        >
            {/* Subtle inner glow for depth */}
            <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
