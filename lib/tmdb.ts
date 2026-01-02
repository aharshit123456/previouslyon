
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN!;
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbFetch = async (endpoint: string, params: Record<string, string> = {}) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`
        }
    };

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
};

export const getTrendingShows = async () => {
    return tmdbFetch('/trending/tv/week');
};

export const searchShows = async (query: string) => {
    return tmdbFetch('/search/tv', { query });
};

export const getShowDetails = async (id: string | number) => {
    return tmdbFetch(`/tv/${id}`);
};

export const getSeasonDetails = async (id: string | number, seasonNumber: number) => {
    return tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
};

// Image Helper
export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
    if (!path) return '';
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

export async function getTVGenres() {
    return tmdbFetch('/genre/tv/list');
}

export const getRecommendations = async (id: string | number) => {
    return tmdbFetch(`/tv/${id}/recommendations`);
};

export const discoverTV = async (params: Record<string, string> = {}) => {
    const defaultParams = {
        include_adult: 'false',
        include_null_first_air_dates: 'false',
        language: 'en-US',
        page: '1',
        sort_by: 'popularity.desc',
        ...params
    };
    return tmdbFetch('/discover/tv', defaultParams);
};
