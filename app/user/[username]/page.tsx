
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

    // 2. Check if it's the current logged in user
    const { data: { session } } = await supabase.auth.getSession();
    const isOwnProfile = session?.user?.id === profile.id;

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
    if (session?.user && !isOwnProfile) {
        const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .match({ follower_id: session.user.id, following_id: profile.id })
            .single();
        isFollowing = !!followData;
    }

    // 4. Fetch Recent Activity
    const { data: recentActivity } = await supabase
        .from('user_episode_progress')
        .select(`
        watched_at,
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
            entity_type
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reviews: any[] = [];
    if (rawReviews && rawReviews.length > 0) {
        const showIds = rawReviews.map(r => r.entity_id);
        const { data: showsData } = await supabase
            .from('shows')
            .select('id, name, poster_path')
            .in('id', showIds);

        const showsMap = new Map(showsData?.map(s => [s.id, s]) || []);

        reviews = rawReviews.map(r => ({
            ...r,
            shows: showsMap.get(r.entity_id)
        }));
    }

    // 7. Fetch Tracked Shows (Distinct logic)
    const { data: progressItems } = await supabase
        .from('user_episode_progress')
        .select(`
            show_id,
            shows (
                id,
                name,
                poster_path
            )
        `)
        .eq('user_id', profile.id)
        .order('watched_at', { ascending: false })
        .limit(100);

    console.log(`PROFILE DEBUG: Progress Items Found: ${progressItems?.length}`);

    const uniqueShowIds = new Set();
    const trackedShows = [];
    if (progressItems) {
        for (const item of progressItems) {
            // @ts-ignore
            const show = Array.isArray(item.shows) ? item.shows[0] : item.shows;

            if (show) {
                if (!uniqueShowIds.has(show.id)) {
                    uniqueShowIds.add(show.id);
                    trackedShows.push(show);
                }
            } else {
                console.log(`PROFILE DEBUG: Show is null for item: ${JSON.stringify(item)}`);
            }
        }
    }
    console.log(`PROFILE DEBUG: Valid Tracked Shows: ${trackedShows.length}`);


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
                                            <p className="text-sm font-bold text-center text-gray-400 leading-tight group-hover:text-primary transition-colors line-clamp-2">{show.name}</p>
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
                                                        {review.shows?.name}
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
                                {recentActivity?.map((item: any, i) => {
                                    const episode = item.episodes;
                                    const show = episode?.shows;
                                    if (!episode || !show) return null;

                                    return (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="relative w-12 aspect-square shrink-0 bg-[#0e1114] rounded-lg overflow-hidden">
                                                {show.poster_path && <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />}
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                                                    {new Date(item.watched_at).toLocaleDateString()}
                                                </div>
                                                <Link href={`/show/${show.id}/season/${episode.season_number}`} className="font-bold text-sm text-white group-hover:text-primary transition-colors line-clamp-1">
                                                    {show.name}
                                                </Link>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    S{episode.season_number} E{episode.episode_number}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!recentActivity || recentActivity.length === 0) && (
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
