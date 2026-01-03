
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'watch') {
            const { showId, episodeId, seasonNumber, episodeNumber, showName, showPoster, showBackdrop, showDate, showOverview } = body;

            // 1. Upsert Show Metadata (Admin to bypass RLS)
            if (showName) {
                const { error: showError } = await supabaseAdmin
                    .from('shows')
                    .upsert({
                        id: showId,
                        name: showName,
                        poster_path: showPoster,
                        backdrop_path: showBackdrop,
                        first_air_date: showDate,
                        overview: showOverview,
                        updated_at: new Date()
                    }, { onConflict: 'id' });

                if (showError) console.error("Show Upsert Error", showError);
            }

            // 2. Upsert Episode Metadata (Admin to bypass RLS)
            const { error: epError } = await supabaseAdmin
                .from('episodes')
                .upsert({
                    id: episodeId,
                    show_id: showId,
                    season_number: seasonNumber,
                    episode_number: episodeNumber,
                    name: `S${seasonNumber} E${episodeNumber}`, // Placeholder
                    updated_at: new Date()
                }, { onConflict: 'id' });

            if (epError) console.error("Episode Upsert Error", epError);

            // 3. Upsert Progress (User Context - using Admin to bypass RLS since we verified user)
            const { error: progError } = await supabaseAdmin
                .from('user_episode_progress')
                .insert({
                    user_id: user.id,
                    episode_id: episodeId
                });

            if (progError) {
                if (progError.code === '23505') { // Unique violation
                    return NextResponse.json({ status: 'already_watched' });
                }
                console.error("Progress Insert Error", progError);
                return NextResponse.json({ error: progError.message }, { status: 500 });
            }

            return NextResponse.json({ status: 'watched' });

        } else if (action === 'unwatch') {
            const { episodeId } = body;

            // Delete progress
            const { error } = await supabaseAdmin
                .from('user_episode_progress')
                .delete()
                .eq('user_id', user.id)
                .eq('episode_id', episodeId);

            if (error) {
                console.error("Progress Delete Error", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ status: 'unwatched' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (err) {
        console.error("API Error", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
