import { fetchRecommendationsAction, fetchShowsByIds } from '@/app/actions/tmdb';
import { getRecommendations, getShowDetails } from '@/lib/tmdb';

// Mock the tmdb library functions
jest.mock('@/lib/tmdb', () => ({
    getRecommendations: jest.fn(),
    getShowDetails: jest.fn(),
}));

describe('TMDB Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchRecommendationsAction', () => {
        it('should return recommendations on success', async () => {
            const mockData = { results: [{ id: 1, name: 'Rec Show' }] };
            (getRecommendations as jest.Mock).mockResolvedValue(mockData);

            const result = await fetchRecommendationsAction('123');

            expect(getRecommendations).toHaveBeenCalledWith('123');
            expect(result).toEqual(mockData);
        });

        it('should return empty results object on error', async () => {
            (getRecommendations as jest.Mock).mockRejectedValue(new Error('API Fail'));

            // Spy on console.error to suppress the output during valid test failure cases
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await fetchRecommendationsAction('123');

            expect(result).toEqual({ results: [] });
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });

    describe('fetchShowsByIds', () => {
        it('should return an array of show details', async () => {
            const mockShow1 = { id: 101, name: 'Show A' };
            const mockShow2 = { id: 102, name: 'Show B' };

            (getShowDetails as jest.Mock)
                .mockResolvedValueOnce(mockShow1)
                .mockResolvedValueOnce(mockShow2);

            const result = await fetchShowsByIds([101, 102]);

            expect(getShowDetails).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockShow1, mockShow2]);
        });

        it('should handle errors by returning an empty array', async () => {
            (getShowDetails as jest.Mock).mockRejectedValue(new Error('Fetch Error'));

            // Spy on console.error
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const result = await fetchShowsByIds([101]);

            expect(result).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
