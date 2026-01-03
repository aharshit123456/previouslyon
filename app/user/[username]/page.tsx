
import { createClient } from '@/lib/supabase-server';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProfileHeader from '@/components/profile-header';
import ListCard from '@/components/list-card';
import type { Metadata } from 'next';
import { Star, Clock, Activity } from 'lucide-react';

export const revalidate = 0; // Force fresh data on profile load

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', decodedUsername)
        .single();

    if (!profile) return { title: 'User Not Found' };

    return {
        title: `${profile.username}'s Profile`,
        description: profile.bio || `Check out ${profile.username}'s TV show lists and watch history on PreviouslyOn.`,
    };
}

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const supabase = await createClient();

    // 1. Get User ID & Profile Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', decodedUsername)
        .single();

    if (!profile) {
        return notFound();
    }

    // 2. Check if it's the current logged in user (Securely)
    // We use getUser() instead of getSession() for validation
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.id;

    // 3. Fetch User Stats (Count)
    const { count: watchedCount } = await supabase
        .from('user_episode_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile.id);

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profile.id);

    // Check if current user follows this profile
    let isFollowing = false;
    if (user && !isOwnProfile) {
        const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .match({ follower_id: user.id, following_id: profile.id })
            .single();
        isFollowing = !!followData;
    }

    // 4. Fetch Recent Activity
    const { data: recentActivity } = await supabase
        .from('user_episode_progress')
        .select(`
        watched_at,
        show_id,
        episode_id,
        episodes (
            name,
            season_number,
            episode_number,
            still_path,
            shows (
                id,
                name,
                poster_path
            )
        )
    `)
        .eq('user_id', profile.id)
        .order('watched_at', { ascending: false })
        .limit(10);

    // 5. Fetch User Lists with Posters
    const { data: rawLists } = await supabase
        .from('lists')
        .select(`
            id, 
            name, 
            description, 
            is_public, 
            list_items (
                shows (
                    poster_path
                )
            )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    // 6. Fetch User Reviews
    const { data: rawReviews } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            body,
            created_at,
            entity_id,
            entity_type,
            show_id,
            season_number,
            episode_number
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    // --- REVIEWS DATA HYDRATION ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reviews: any[] = [];
    if (rawReviews && rawReviews.length > 0) {

        // DEBUG: Log all review details
        console.log("PROFILE DEBUG: Raw Reviews:", rawReviews.map(r => ({
            id: r.id,
            type: r.entity_type,
            entity_id: r.entity_id,
            show_id: r.show_id,
            season: r.season_number,
            episode: r.episode_number
        })));

        // 1. Try local DB
        const entityIds = rawReviews.map(r => r.entity_id);
        const { data: localShows } = await supabase
            .from('shows')
            .select('id, name, poster_path')
            .in('id', entityIds);

        const showsMap = new Map<number, any>(localShows?.map(s => [s.id, s]) || []);

        // 2. Identify missing
        // For 'show' type reviews, entity_id is show_id.
        // For 'episode' type reviews, entity_id is episode_id, BUT we now have show_id/season/episode columns too!
        const missingIds = rawReviews.filter(r => {
            if (r.entity_type === 'show') return !showsMap.has(r.entity_id);
            // If it's an episode review, we need show info. 
            // If show_id is present, we check showsMap (if we fetched it? No, we only fetched by entity_id).
            // Let's rely on the direct join first. 
            // If direct join (reviews -> shows) failed (null show_id or null shows object), we need fallback.

            // Logic: If r.shows is missing, we need to fetch.
            // @ts-ignore
            return !r.shows && !showsMap.has(r.entity_id);
        });

        // 3. Fallback Fetch
        const fallbackMap = new Map<string, any>(); // Key: ${type}_${id}

        if (missingIds.length > 0) {
            console.log(`PROFILE DEBUG: Missing ${missingIds.length} review entities/shows in local DB. Fetching from TMDB...`);

            await Promise.all(missingIds.map(async (r) => {
                const key = `${r.entity_type}_${r.entity_id}`;
                if (fallbackMap.has(key)) return;

                try {
                    const { getShowDetails, getEpisodeDetails } = await import('@/lib/tmdb');

                    if (r.entity_type === 'show') {
                        const tmdbData = await getShowDetails(r.entity_id.toString());
                        if (tmdbData) {
                            fallbackMap.set(key, { ...tmdbData, type: 'show' });
                        }
                    } else if (r.entity_type === 'episode') {
                        // Use the new schema fields if available
                        if (r.show_id && r.season_number && r.episode_number) {
                            console.log(`PROFILE DEBUG: Fetching episode details for Show ${r.show_id} S${r.season_number}E${r.episode_number}`);
                            const epData = await getEpisodeDetails(r.show_id, r.season_number, r.episode_number);

                            // We need Show data too for the poster/name context
                            // If we don't have show data in Map, fetch it.
                            let showData = showsMap.get(r.show_id);
                            if (!showData) {
                                // Try fetching show details
                                showData = await getShowDetails(r.show_id.toString());
                            }

                            fallbackMap.set(key, {
                                ...showData,
                                ...epData,
                                type: 'episode',
                                episode_name: epData.name,
                                season: epData.season_number,
                                number: epData.episode_number
                            });
                        } else {
                            // Legacy fallback (try entity_id as show_id?? No, entity_id for episode is likely internal or unknown)
                            console.warn(`PROFILE DEBUG: Cannot fetch fallback for episode review ${r.id} - Missing metadata`);
                        }
                    }

                } catch (e) {
                    console.error(`Failed to fetch fallback for review entity ${r.entity_id} (${r.entity_type})`, e);
                }
            }));
        }

        reviews = rawReviews.map(r => {
            const key = `${r.entity_type}_${r.entity_id}`;
            const fallback = fallbackMap.get(key);

            // @ts-ignore
            let showData = r.shows || showsMap.get(r.entity_id);

            if (!showData && fallback) {
                if (r.entity_type === 'show') {
                    showData = fallback;
                } else if (r.entity_type === 'episode') {
                    // Fallback object has mixed properties
                    showData = {
                        id: r.show_id || fallback.id, // ID might be ambiguous here
                        name: fallback.name, // Show name (hopefully)
                        poster_path: fallback.poster_path
                    };
                }
            }

            return {
                ...r,
                shows: showData
            };
        });
    }

    // --- TRACKED SHOWS & ACTIVITY HYDRATION ---
    // Now that we have show_id, season, episode in user_episode_progress, we can be much smarter.

    // 1. Fetch Progress (Raw)
    const { data: rawProgress } = await supabase
        .from('user_episode_progress')
        .select(`
            episode_id,
            watched_at,
            show_id,
            season_number,
            episode_number,
            episodes (
                season_number,
                episode_number,
                shows (
                    id,
                    name,
                    poster_path
                )
            )
        `)
        .eq('user_id', profile.id)
        .order('watched_at', { ascending: false })
        .limit(200);

    const uniqueShowIds = new Set<number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trackedShows: any[] = [];
    const missingShowIds = new Set<number>();

    // We also need to prepare "Recent Activity" with valid data (some might be missing locally)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hydratedActivity: any[] = [];

    if (rawProgress) {
        // Collect all potential Show IDs for bulk fetch later if needed (though we do 1-by-1 fallback usually)
        for (const item of rawProgress) {
            // Safe access for potentially array-typed relations
            // @ts-ignore
            const episodeObj = Array.isArray(item.episodes) ? item.episodes[0] : item.episodes;
            // @ts-ignore
            let show: any = episodeObj?.shows;
            if (Array.isArray(show)) show = show[0];

            let showId = item.show_id;

            // If join worked, great.
            if (show) {
                showId = show.id; // Confirm ID
            } else if (showId) {
                // Join failed, but we have ID. Need to fetch.
                missingShowIds.add(showId);
            }
            // Redundant check removed

            if (show && !uniqueShowIds.has(show.id)) {
                uniqueShowIds.add(show.id);
                trackedShows.push(show);
            }
        }

        // Handle Missing Shows (Tracked Shows) - Fallback
        if (missingShowIds.size > 0) {
            console.log(`PROFILE DEBUG: Missing ${missingShowIds.size} shows in progress join. Fetching...`);
            const { getShowDetails } = await import('@/lib/tmdb');
            await Promise.all(Array.from(missingShowIds).map(async (id) => {
                try {
                    const tmdb = await getShowDetails(id.toString());
                    if (tmdb) {
                        if (!uniqueShowIds.has(tmdb.id)) {
                            uniqueShowIds.add(tmdb.id);
                            trackedShows.push(tmdb);
                        }
                    }
                } catch (e) { }
            }));
        }

        // Hydrate Activity Items (for the Timeline)
        // We take the top 10 from rawProgress
        const activitySlice = rawProgress.slice(0, 10);

        await Promise.all(activitySlice.map(async (item) => {
            // @ts-ignore
            let episode = item.episodes;
            // @ts-ignore
            let show = episode?.shows;

            // If we have local data, use it
            if (episode && show) {
                hydratedActivity.push({
                    watched_at: item.watched_at,
                    episode,
                    show
                });
                return;
            }

            // If missing local data, but we have the new schema columns:
            if (item.show_id && item.season_number && item.episode_number) {
                try {
                    const { getEpisodeDetails, getShowDetails } = await import('@/lib/tmdb');
                    // Fetch Show (if not in trackedShows map, but we likely have it or can fetch)
                    // Optimization: Use `trackedShows` array which might have it?
                    const cachedShow = trackedShows.find(s => s.id === item.show_id);
                    let showData = cachedShow;

                    if (!showData) {
                        showData = await getShowDetails(item.show_id.toString());
                    }

                    if (showData) {
                        // Fetch Episode
                        const epData = await getEpisodeDetails(item.show_id, item.season_number, item.episode_number);
                        if (epData) {
                            hydratedActivity.push({
                                watched_at: item.watched_at,
                                episode: {
                                    season_number: epData.season_number,
                                    episode_number: epData.episode_number,
                                    name: epData.name,
                                    still_path: epData.still_path
                                },
                                show: showData
                            });
                        }
                    }
                } catch (e) {
                    console.error("Activity Hydration Error", e);
                }
            }
        }));

        // Sort activity by date again since async might have scrambled order (push)? 
        // No, Promise.all runs in parallel, but push order is race-condition dependent.
        // Needs sort.
        hydratedActivity.sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
    }


    // Process lists for card
    const userLists = rawLists?.map((list: any) => {
        const posters = list.list_items
            ?.map((item: any) => item.shows?.poster_path)
            .filter(Boolean) || [];

        return {
            id: list.id,
            name: list.name,
            description: list.description,
            is_public: list.is_public,
            count: list.list_items?.length || 0,
            posters
        };
    }) || [];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.username,
        image: profile.avatar_url,
        description: profile.bio,
    };

    return (
        <div className="pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Suspense fallback={<div className="h-64 bg-[#1c2229] animate-pulse" />}>
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    isFollowing={isFollowing}
                    stats={{
                        watchedCount: watchedCount || 0,
                        listsCount: userLists.length,
                        followersCount: followersCount || 0,
                        followingCount: followingCount || 0
                    }}
                />
            </Suspense>

            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">

                    {/* LEFT COLUMN (Main Content) */}
                    <div className="space-y-16">

                        {/* Tracked Shows */}
                        <div>
                            <div className="flex items-center justify-between mb-8 border-b border-[#2c3440] pb-4">
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Tracked Shows</h3>
                                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">{trackedShows.length} Shows</span>
                            </div>

                            {trackedShows.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
                                    {trackedShows.slice(0, 10).map((show: any) => (
                                        <Link key={show.id} href={`/show/${show.id}`} className="block group">
                                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-[#1c2229] mb-3 shadow-md group-hover:shadow-xl transition-all group-hover:-translate-y-1 ring-1 ring-[#2c3440]">
                                                {show.poster_path ? (
                                                    <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-gray-500">No Image</div>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-center text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">{show.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic text-lg font-medium p-10 bg-[#1c2229] rounded-2xl border border-[#2c3440] text-center">No shows tracked yet.</div>
                            )}
                        </div>

                        {/* Recent Reviews */}
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-8 border-b border-[#2c3440] pb-4">Recent Reviews</h3>
                            {reviews && reviews.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="bg-[#1c2229] p-6 rounded-2xl border border-[#2c3440] shadow-sm hover:shadow-md transition-all flex flex-col h-full hover:border-[#3c4656]">
                                            <div className="flex gap-4 mb-4">
                                                <Link href={`/show/${review.shows?.id}`} className="shrink-0 w-16 aspect-[2/3] relative rounded-lg overflow-hidden bg-[#0e1114]">
                                                    {review.shows?.poster_path ? (
                                                        <Image src={getImageUrl(review.shows.poster_path)} alt={review.shows.name} fill className="object-cover" />
                                                    ) : <div />}
                                                </Link>
                                                <div>
                                                    <Link href={`/show/${review.shows?.id}`} className="font-bold text-lg text-white hover:text-primary transition-colors line-clamp-1">
                                                        {review.shows?.name || 'Unknown Show'}
                                                    </Link>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < Math.round(review.rating / 2) ? 'fill-amber-400 text-amber-400' : 'fill-[#2c3440] text-[#2c3440]'}`} />
                                                        ))}
                                                        <span className="text-xs font-bold text-gray-500 ml-2">{review.rating}/10</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2 font-medium">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">"{review.body}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic text-lg font-medium p-10 bg-[#1c2229] rounded-2xl border border-[#2c3440] text-center">No reviews yet.</div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN (Sidebar) */}
                    <div className="space-y-12">

                        {/* User Lists */}
                        <div>
                            <div className="flex items-center justify-between mb-6 border-b border-[#2c3440] pb-4">
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">Lists</h3>
                                {isOwnProfile && <Link href="/lists" className="text-xs font-bold text-primary hover:text-white uppercase">Manage</Link>}
                            </div>

                            {userLists.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {userLists.map((list: any) => (
                                        <ListCard key={list.id} list={list} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic text-sm font-medium p-6 bg-[#1c2229] rounded-xl border border-[#2c3440] text-center">No lists yet.</div>
                            )}
                        </div>

                        {/* Activity Timeline */}
                        <div className="bg-[#1c2229] p-6 rounded-2xl shadow-xl border border-[#2c3440]">
                            <div className="flex items-center gap-2 mb-6 border-b border-[#2c3440] pb-4">
                                <Activity className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">Recent Activity</h3>
                            </div>

                            <div className="space-y-6">
                                {hydratedActivity.map((item: any, i: number) => {
                                    const episode = item.episode;
                                    const show = item.show;

                                    if (!episode || !show) return null;

                                    return (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="relative w-12 aspect-square shrink-0 bg-[#0e1114] rounded-lg overflow-hidden">
                                                {show?.poster_path ? (
                                                    <Image src={getImageUrl(show.poster_path)} alt={show?.name || 'Show'} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-800" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                                                    {new Date(item.watched_at).toLocaleDateString()}
                                                </div>
                                                <Link href={`/show/${show.id}/season/${episode.season_number}`} className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-1">
                                                    {show?.name}
                                                </Link>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    S{episode.season_number} E{episode.episode_number}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!hydratedActivity || hydratedActivity.length === 0) && (
                                    <div className="text-gray-500 italic text-sm text-center py-4">No recent activity.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
