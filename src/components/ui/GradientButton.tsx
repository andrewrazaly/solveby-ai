import { ReactNode } from 'react';
import Link from 'next/link';

interface GradientButtonProps {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
    fullWidth?: boolean;
}

export const GradientButton = ({
    children,
    href,
    onClick,
    variant = 'primary',
    className = '',
    fullWidth = false
}: GradientButtonProps) => {

    const baseStyles = `
    inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary/50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

    const variants = {
        primary: 'bg-primary hover:bg-indigo-500 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40',
        secondary: 'bg-secondary hover:bg-emerald-500 text-white shadow-lg shadow-secondary/25 hover:shadow-secondary/40',
        outline: 'bg-transparent border border-white/20 text-white hover:bg-white/5 hover:border-white/40'
    };

    const combinedClasses = `${baseStyles} ${variants[variant]} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={combinedClasses}>
            {children}
        </button>
    );
};
