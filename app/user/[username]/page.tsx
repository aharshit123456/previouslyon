
import { createClient } from '@/lib/supabase-server';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProfileHeader from '@/components/profile-header';
import ListCard from '@/components/list-card';
import type { Metadata } from 'next';

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
        openGraph: {
            title: `${profile.username} on PreviouslyOn`,
            description: profile.bio || `Check out ${profile.username}'s TV show lists.`,
            images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
        }
    };
}

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);
    const supabase = await createClient();

    // 1. Get User ID & Profile Data
    const { data: profile, error: profileError } = await supabase
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
        .limit(20);

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
    const { data: rawReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            body,
            created_at,
            entity_id
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    console.log('[UserProfile] Reviews fetch:', { count: rawReviews?.length, error: reviewsError });

    let reviews = [];
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

    const uniqueShowIds = new Set();
    const trackedShows = [];
    if (progressItems) {
        for (const item of progressItems) {
            const show = Array.isArray(item.shows) ? item.shows[0] : item.shows;

            if (show && !uniqueShowIds.has(show.id)) {
                uniqueShowIds.add(show.id);
                trackedShows.push(show);
            }
        }
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
        interactionStatistic: [
            {
                '@type': 'InteractionCounter',
                interactionType: 'https://schema.org/WatchAction',
                userInteractionCount: watchedCount
            }
        ]
    };

    return (
        <div className="pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Suspense fallback={<div className="h-64 bg-[#14181c] animate-pulse" />}>
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
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10">
                    {/* LEFT COLUMN */}
                    <div className="space-y-10">
                        {/* Tracked Shows */}
                        <div>
                            <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4 border-b border-[#445566] pb-2">Tracked Shows</h3>
                            {trackedShows.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {trackedShows.slice(0, 8).map((show: any) => (
                                        <Link key={show.id} href={`/show/${show.id}`} className="block group">
                                            <div className="aspect-[2/3] relative rounded overflow-hidden bg-[#2c3440] mb-2 border border-transparent group-hover:border-sky-blue transition-colors">
                                                {show.poster_path ? (
                                                    <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-gray-500">No Image</div>
                                                )}
                                            </div>
                                            <p className="text-xs text-center text-[#99aabb] group-hover:text-white truncate transition-colors">{show.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-pastel-petal italic text-sm">No shows tracked yet.</div>
                            )}
                        </div>

                        {/* Reviews Section */}
                        <div>
                            <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4 border-b border-[#445566] pb-2">Reviews</h3>
                            {reviews && reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="bg-[#1c2229] p-5 rounded border border-[#445566] flex gap-4">
                                            <Link href={review.entity_type === 'episode' && review.episode ? `/show/${review.shows?.id}/season/${review.episode.season_number}` : `/show/${review.shows?.id}`} className="shrink-0 w-16 md:w-20 aspect-[2/3] relative rounded overflow-hidden hover:opacity-80 transition-opacity">
                                                {review.shows?.poster_path ? (
                                                    <Image src={getImageUrl(review.shows.poster_path)} alt={review.shows.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-[#2c3440]" />
                                                )}
                                            </Link>

                                            <div className="flex-grow">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <Link href={review.entity_type === 'episode' && review.episode ? `/show/${review.shows?.id}/season/${review.episode.season_number}` : `/show/${review.shows?.id}`} className="font-bold text-white hover:text-primary transition-colors block">
                                                            {review.shows?.name}
                                                        </Link>
                                                        {review.entity_type === 'episode' && review.episode && (
                                                            <div className="text-sm text-sky-blue">
                                                                S{review.episode.season_number} E{review.episode.episode_number} - {review.episode.name}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-[#99aabb] mt-1">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-[#2c3440] px-2 py-1 rounded">
                                                        <span className="text-yellow-500 font-bold">★</span>
                                                        <span className="text-white font-medium">{review.rating}</span>
                                                        <span className="text-[#99aabb] text-xs">/10</span>
                                                    </div>
                                                </div>

                                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                                    {review.body}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#1c2229] p-4 rounded border border-[#445566] text-center text-[#99aabb] italic text-sm">
                                    No reviews written yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-10">
                        {/* Recent Activity */}
                        <div>
                            <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4 border-b border-[#445566] pb-2">Recent Activity</h3>
                            <div className="space-y-4">
                                {recentActivity?.map((item: any, i) => {
                                    const episode = item.episodes;
                                    const show = episode?.shows;
                                    if (!episode || !show) return null;

                                    return (
                                        <div key={i} className="flex gap-4 p-4 bg-[#1c2229] rounded border border-[#445566] hover:border-[#556677] transition-all group">
                                            <div className="relative w-16 aspect-[2/3] shrink-0 bg-black rounded overflow-hidden">
                                                {show.poster_path ? (
                                                    <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-gray-600">No Img</div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="text-sm text-[#99aabb] mb-1">
                                                    Watched <span className="text-white font-bold">{new Date(item.watched_at).toLocaleDateString()}</span>
                                                </div>
                                                <Link href={`/show/${show.id}/season/${episode.season_number}`} className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                    {show.name}
                                                    <span className="text-thistle font-normal ml-2">S{episode.season_number} E{episode.episode_number}</span>
                                                </Link>
                                                <p className="text-sm text-pastel-petal/80">{episode.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!recentActivity || recentActivity.length === 0) && (
                                    <div className="text-pastel-petal italic">No activity yet. Go watch some TV!</div>
                                )}
                            </div>
                        </div>

                        {/* User Lists */}
                        <div>
                            <div className="flex items-center justify-between mb-4 border-b border-[#445566] pb-2">
                                <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider">User Lists</h3>
                                {isOwnProfile && (
                                    <Link href="/lists" className="text-xs text-primary hover:text-white">Manage</Link>
                                )}
                            </div>

                            {userLists.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {userLists.map((list: any) => (
                                        <ListCard key={list.id} list={list} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#1c2229] p-4 rounded border border-[#445566] text-center text-[#99aabb] italic text-sm">
                                    No lists created yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
