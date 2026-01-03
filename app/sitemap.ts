import { MetadataRoute } from 'next';
// We can't use 'server-only' functions that rely on cookies/headers easily here unless we're careful.
// Using the public lib functions should be fine if they are just fetch wrappers.
import { getTrendingShows } from '@/lib/tmdb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 1. Static Routes
    const routes = [
        '',
        '/lists',
        '/signup',
        '/signin',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // 2. Dynamic Trending Shows (Limit to top results)
    let showRoutes: MetadataRoute.Sitemap = [];
    try {
        const trending = await getTrendingShows();
        showRoutes = (trending.results || []).slice(0, 50).map((show: any) => ({
            url: `${baseUrl}/show/${show.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));
    } catch (e) {
        console.error("Sitemap generation failed for shows", e);
    }

    return [...routes, ...showRoutes];
}
