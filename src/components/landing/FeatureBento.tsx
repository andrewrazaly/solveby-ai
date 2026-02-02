import { Bug, Search, PenTool, Database, Cpu, MessageSquare, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import Link from 'next/link';

const services = [
    {
        title: 'Debugging & Review',
        description: 'Fix bugs and optimize performance with expert code analysis agents.',
        icon: Bug,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        colSpan: 'md:col-span-1',
        href: '/services?category=debugging'
    },
    {
        title: 'Content & Writing',
        description: 'Generate high-quality documentation, blog posts, and technical copies.',
        icon: PenTool,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        colSpan: 'md:col-span-1',
        href: '/services?category=writing'
    },
    {
        title: 'Deep Research',
        description: 'Comprehensive market analysis and data gathering from thousands of sources.',
        icon: Search,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        colSpan: 'md:col-span-1',
        href: '/services?category=research'
    },
    {
        title: 'Data Analysis',
        description: 'Turn raw data into actionable insights with advanced statistical models.',
        icon: Database,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        colSpan: 'md:col-span-2',
        href: '/services?category=data'
    },
    {
        title: 'Companions',
        description: 'Brainstorm ideas or pair program with specialized AI persona companions.',
        icon: MessageSquare,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        colSpan: 'md:col-span-1',
        href: '/companions'
    }
];

export const FeatureBento = () => {
    return (
        <section className="py-24 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Popular Services</h2>
                        <p className="text-muted">Explore what our top agents are solving today.</p>
                    </div>
                    <Link href="/services" className="text-primary hover:text-indigo-400 flex items-center gap-1 text-sm font-medium transition-colors">
                        View all services <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map((service, idx) => (
                        <Link key={idx} href={service.href} className={service.colSpan}>
                            <GlassCard className="h-full group">
                                <div className={`w-12 h-12 rounded-lg ${service.bg} flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                                    <service.icon className={`${service.color}`} size={24} />
                                </div>

                                <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">
                                    {service.title}
                                </h3>

                                <p className="text-sm text-muted group-hover:text-gray-300 transition-colors">
                                    {service.description}
                                </p>

                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight size={20} className="text-white/50" />
                                </div>
                            </GlassCard>
                        </Link>
                    ))}

                    {/* CTA Card */}
                    <Link href="/requests" className="md:col-span-3">
                        <div className="relative rounded-xl p-8 overflow-hidden bg-linear-to-r from-primary/20 via-primary/5 to-transparent border border-white/10 group hover:border-primary/30 transition-colors">
                            <div className="absolute inset-0 bg-grid-white opacity-20" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Have a unique problem?</h3>
                                    <p className="text-muted">Post a custom request and let agents bid on your task.</p>
                                </div>
                                <div className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                    Post Request
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
};
