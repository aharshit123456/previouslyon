import { getAIRecommendations } from '@/app/actions/ai';
// Mocks must be hoisted or defined before imports if using jest.mock with factory
import { geminiModel } from '@/lib/gemini';
import { createClient } from '@/lib/supabase-server';

// Mock dependencies
jest.mock('@/lib/gemini', () => ({
    geminiModel: {
        generateContent: jest.fn(),
    },
}));

jest.mock('@/lib/supabase-server', () => ({
    createClient: jest.fn(),
}));

describe('AI Actions', () => {
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup Supabase Mock Chain
        mockSupabase = {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        single: jest.fn(),
                        limit: jest.fn(),
                    })),
                })),
            })),
        };
        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    it('should return recommendations successfully', async () => {
        // 1. Mock User
        mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
        });

        // 2. Mock Profile Fetch (chain: from -> select -> eq -> single)
        // We need to carefully reconstruct the chain mocks to return values
        const mockSingle = jest.fn().mockResolvedValue({ data: { bio: 'I love sci-fi' } });
        const mockEqProfile = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelectProfile = jest.fn().mockReturnValue({ eq: mockEqProfile });

        // 3. Mock Lists Fetch (chain: from -> select -> eq -> limit)
        const mockLimit = jest.fn().mockResolvedValue({
            data: [
                { name: 'Favs', list_items: [{ shows: { name: 'Dark' } }] }
            ]
        });
        const mockEqLists = jest.fn().mockReturnValue({ limit: mockLimit });
        const mockSelectLists = jest.fn().mockReturnValue({ eq: mockEqLists });

        // Apply specific mocks to table names
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'profiles') return { select: mockSelectProfile };
            if (table === 'lists') return { select: mockSelectLists };
            return { select: jest.fn() };
        });

        // 4. Mock Gemini
        const mockGeminiResponse = {
            response: {
                text: jest.fn().mockReturnValue(JSON.stringify({
                    response: "Here are some shows",
                    codes: [1, 2, 3]
                }))
            }
        };
        (geminiModel.generateContent as jest.Mock).mockResolvedValue(mockGeminiResponse);

        const result = await getAIRecommendations('Recommend me something');

        expect(result).toEqual({
            response: "Here are some shows",
            codes: [1, 2, 3]
        });

        // Verify calls
        expect(createClient).toHaveBeenCalled();
        expect(mockSupabase.auth.getUser).toHaveBeenCalled();
        expect(geminiModel.generateContent).toHaveBeenCalledWith(expect.stringContaining('I love sci-fi'));
    });

    it('should handle authenticated user missing', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await getAIRecommendations('Query');

        expect(result).toEqual({ response: expect.stringContaining('Sorry'), codes: [] });
        expect(consoleSpy).toHaveBeenCalled(); // Should log error
        consoleSpy.mockRestore();
    });

    it('should handle Gemini parsing errors or bad format', async () => {
        // Mock User Success
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u' } } });
        // Mock generic empty data for others to simplify setup
        mockSupabase.from.mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: {} }),
                    limit: jest.fn().mockResolvedValue({ data: [] })
                })
            })
        });

        // Gemini returns invalid JSON
        (geminiModel.generateContent as jest.Mock).mockResolvedValue({
            response: { text: jest.fn().mockReturnValue('Invalid JSON') }
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await getAIRecommendations('Q');

        expect(result.codes).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
