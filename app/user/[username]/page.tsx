import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProfileHeader from '@/components/profile-header';
import ListCard from '@/components/list-card';

export const revalidate = 0; // Force fresh data on profile load

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

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

    // Process lists to match ListCard props
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

    return (
        <div className="pb-20">
            {/* New Profile Header - Client Component */}
            <Suspense fallback={<div className="h-64 bg-[#14181c] animate-pulse" />}>
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    stats={{
                        watchedCount: watchedCount || 0,
                        listsCount: userLists.length
                    }}
                />
            </Suspense>

            <div className="container-custom">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-10">
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
    );
}
