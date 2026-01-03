import { getImageUrl, tmdbFetch, getTrendingShows, searchShows } from '@/lib/tmdb';

// Mock global fetch
global.fetch = jest.fn();

describe('TMDB Utility Functions', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getImageUrl', () => {
        it('should return the correct URL for a given path and default size', () => {
            const path = '/example.jpg';
            const expected = 'https://image.tmdb.org/t/p/w500/example.jpg';
            expect(getImageUrl(path)).toBe(expected);
        });

        it('should return the correct URL for a given path and specified size', () => {
            const path = '/example.jpg';
            const size = 'original';
            const expected = 'https://image.tmdb.org/t/p/original/example.jpg';
            expect(getImageUrl(path, size)).toBe(expected);
        });

        it('should return an empty string if path is null', () => {
            expect(getImageUrl(null)).toBe('');
        });

        it('should return an empty string if path is empty', () => {
            expect(getImageUrl('')).toBe('');
        });
    });

    describe('tmdbFetch', () => {
        it('should make a request with correct headers and params', async () => {
            const mockResponse = { results: [] };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await tmdbFetch('/test-endpoint', { page: '1' });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://api.themoviedb.org/3/test-endpoint?page=1'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: expect.stringContaining('Bearer'),
                    }),
                })
            );
            expect(result).toEqual(mockResponse);
        });

        it('should throw an error when response is not ok', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
            });

            await expect(tmdbFetch('/test')).rejects.toThrow('TMDB API Error: 401 Unauthorized');
        });
    });

    describe('getTrendingShows', () => {
        it('should call tmdbFetch with correct endpoint', async () => {
            const mockResponse = { results: [{ id: 1, name: 'Show' }] };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await getTrendingShows();
            expect(result).toEqual(mockResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/trending/tv/week'),
                expect.any(Object)
            );
        });
    });

    describe('searchShows', () => {
        it('should allow searching for shows', async () => {
            const mockResponse = { results: [] };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await searchShows('Breaking Bad');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('query=Breaking+Bad'),
                expect.any(Object)
            );
        });
    });
});
