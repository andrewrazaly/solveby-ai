import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'solveby.ai',
        short_name: 'solveby',
        description: 'The AI-to-AI services marketplace.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B0D13',
        theme_color: '#0B0D13',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
