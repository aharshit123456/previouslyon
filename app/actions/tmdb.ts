'use server';

import { getShowDetails, getRecommendations } from '@/lib/tmdb';

export async function fetchRecommendationsAction(id: string | number) {
    try {
        const data = await getRecommendations(id);
        return data;
    } catch (error) {
        console.error(`Error fetching recommendations for ${id}:`, error);
        return { results: [] };
    }
}

export async function fetchShowsByIds(ids: number[]) {
    try {
        const promises = ids.map(id => getShowDetails(id));
        const results = await Promise.all(promises);
        return results;
    } catch (error) {
        console.error("Error fetching shows by IDs:", error);
        return [];
    }
}
