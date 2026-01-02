'use server';

import { getRecommendations } from '@/lib/tmdb';

export async function fetchRecommendationsAction(id: string | number) {
    try {
        const data = await getRecommendations(id);
        return data;
    } catch (error) {
        console.error(`Error fetching recommendations for ${id}:`, error);
        return { results: [] };
    }
}
