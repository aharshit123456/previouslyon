import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { geminiModel } from '@/lib/gemini';
import { getShowDetails } from '@/lib/tmdb';

// This route should be protected or hidden in production
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic'); // Optional: ?topic=SciFi
    const limit = searchParams.get('limit') || '3'; // Default to 3 lists if running auto

    const prompts = topic ? [topic] : [
        "Underrated 90s Sitcoms",
        "Best Cyberpunk Anime",
        "Mind-Bending Psychological Thrillers",
        "Shows with the Best Plot Twists",
        "Cozy Mysteries for Rainy Days",
        "Political Dramas giving House of Cards vibes",
        "Zombie Apocalypse Survival Guides"
    ];

    const results = [];

    for (const promptText of prompts.slice(0, Number(limit))) {
        try {

            // 1. Generate List via Gemini
            const geminiPrompt = `
                Generate a curated list of TV shows based on this topic: "${promptText}".
                Return valid JSON with:
                - title: A creative title for the list.
                - description: A short description (2 sentences).
                - shows: An array of TMDB TV Show IDs (integers). Provide 20 distinct shows.
                Example: { "title": "Cyberpunk Classics", "description": "...", "shows": [123, 456] }
            `;

            console.log(`[Seed] Generating list for: ${promptText}`);
            const result = await geminiModel.generateContent(geminiPrompt);
            const responseText = await result.response.text();
            const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
            const data = JSON.parse(cleanedText);

            // 2. Create List in DB
            const { data: listData, error: listError } = await supabase
                .from('lists')
                .insert({
                    user_id: user.id,
                    name: data.title,
                    description: data.description,
                    is_public: true
                })
                .select()
                .single();

            if (listError || !listData) {
                console.error("List creation failed", listError);
                continue;
            }

            // 3. Process Shows
            const showIds = data.shows;
            let addedCount = 0;

            for (const showId of showIds) {
                // Save Show to 'shows' table if not exists
                // We fetch details first to get name/poster
                try {
                    const tmdbShow = await getShowDetails(showId);

                    // Upsert show (assuming 'shows' table matches these fields)
                    const { error: showUpsertError } = await supabase
                        .from('shows')
                        .upsert({
                            id: tmdbShow.id,
                            name: tmdbShow.name,
                            poster_path: tmdbShow.poster_path,
                            first_air_date: tmdbShow.first_air_date ? tmdbShow.first_air_date : null,
                            vote_average: tmdbShow.vote_average,
                        }, { onConflict: 'id' });

                    if (showUpsertError) {
                        console.error(`Show upsert failed for ${showId}`, showUpsertError);
                        // If strict, continue. If lax, maybe it already exists and error is ignored? 
                        // Upsert shouldn't error on conflict.
                    }

                    // Add to list_items
                    await supabase
                        .from('list_items')
                        .insert({
                            list_id: listData.id,
                            show_id: showId
                        });

                    addedCount++;
                } catch (e) {
                    console.error(`Failed to process show ${showId}`, e);
                }
            }

            results.push({ list: data.title, showsAdded: addedCount });

        } catch (e) {
            console.error(`List generation failed for topic ${promptText}`, e);
            results.push({ list: promptText, error: String(e) });
        }
    }

    return NextResponse.json({ success: true, results });
}
