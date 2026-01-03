import { getImageUrl } from '@/lib/tmdb';

describe('TMDB Utility Functions', () => {
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
});
