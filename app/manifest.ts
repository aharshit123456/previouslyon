import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PreviouslyOn',
        short_name: 'PreviouslyOn',
        description: 'Track your TV shows and share with friends.',
        start_url: '/',
        display: 'standalone',
        background_color: '#14181c',
        theme_color: '#00D1FF', // Primary color
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
