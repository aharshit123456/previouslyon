'use server';

import { geminiModel } from '@/lib/gemini';
import { createClient } from '@/lib/supabase-server';

export async function getAIRecommendations(userQuery: string) {
    try {
        const supabase = await createClient();

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("User not authenticated");
        }

        // 2. Fetch User Profile (Bio)
        const { data: profile } = await supabase
            .from('profiles')
            .select('bio')
            .eq('id', user.id)
            .single();

        // 3. Fetch User Lists (for context)
        const { data: lists } = await supabase
            .from('lists')
            .select(`
            name,
            list_items (
                shows (
                    name
                )
            )
        `)
            .eq('user_id', user.id)
            .limit(3);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listContext = lists?.map(l => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const showNames = l.list_items?.map((item: { shows: any }) => (Array.isArray(item.shows) ? item.shows[0]?.name : item.shows?.name)).filter(Boolean).join(', ');
            return `List "${l.name}": ${showNames}`;
        }).join('\n');

        // 4. Construct Prompt
        const prompt = `
    You are a personalized TV show assistant.
    
    User Context:
    Bio: ${profile?.bio || 'No bio available.'}
    
    User's Recently Created Lists (for taste context):
    ${listContext || 'No lists available.'}
    
    Current User Query: "${userQuery}"
    
    Based on the user's bio, their existing lists, and their specific query, recommend TV shows.
    
    Return a valid JSON object with exactly these two keys:
    1. "response": A friendly, natural language response talking to the user, explaining why you picked these shows. Keep it concise but engaging.
    2. "codes": An array of TMDB TV Show IDs (integers) for the recommended shows. Ensure these are valid TMDB IDs.
    
    Example Output:
    {
      "response": "Since you like sci-fi, here are some great picks...",
      "codes": [123, 456, 789]
    }
    `;

        // 5. Call Gemini
        console.log("Sending prompt to Gemini...");
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Clean up markdown code blocks if present (Gemini sometimes adds ```json ... ```)
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        const parsed = JSON.parse(cleanedText);
        console.log("Parsed AI Response:", parsed);

        return parsed;

    } catch (error) {
        console.error("AI Recommendation Error:", error);
        return {
            response: "Sorry, I ran into trouble fetching recommendations. Please try again.",
            codes: []
        };
    }
}
