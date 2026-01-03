import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/profile-header';

export const revalidate = 0; // Force fresh data on profile load so edits show up

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const decodedUsername = decodeURIComponent(username);

    // 1. Get User ID & Profile Data
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Select all including new fields
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

    // 5. Fetch User Lists
    const { data: userLists } = await supabase
        .from('lists')
        .select('id, name, description, is_public, list_items(count)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    return (
        <div className="pb-20">
            {/* New Profile Header - Client Component */}
            <ProfileHeader
                profile={profile}
                isOwnProfile={isOwnProfile}
                stats={{
                    watchedCount: watchedCount || 0,
                    listsCount: userLists?.length || 0
                }}
            />

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
                        <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4 border-b border-[#445566] pb-2">User Lists</h3>

                        {userLists && userLists.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {userLists.map((list: any) => (
                                    <Link key={list.id} href={`/lists/${list.id}`} className="block p-4 bg-[#1c2229] border border-[#445566] rounded hover:border-sky-blue transition-colors">
                                        <h4 className="font-bold text-white mb-1">{list.name}</h4>
                                        {list.description && <p className="text-sm text-[#99aabb] line-clamp-2 mb-2">{list.description}</p>}
                                        <div className="flex items-center justify-between text-xs text-[#667788]">
                                            <span>{list.list_items?.[0]?.count || 0} items</span>
                                            {!list.is_public && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Private</span>}
                                        </div>
                                    </Link>
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

if (!profile) {
    return notFound();
}

// 2. Fetch User Stats (Count)
const { count: watchedCount } = await supabase
    .from('user_episode_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id);

// 3. Fetch Recent Activity
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

// 4. Fetch User Lists
const { data: userLists } = await supabase
    .from('lists')
    .select('id, name, description, is_public, list_items(count)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

return (
    <div className="container-custom py-10">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start border-b border-[#445566] pb-10 mb-10">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#2c3440] border-4 border-[#445566] flex items-center justify-center text-[#99aabb]">
                {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={username} fill className="object-cover" />
                ) : (
                    <User className="w-16 h-16" />
                )}
            </div>
            <div className="text-center md:text-left">
                <h1 className="text-4xl font-bold text-white mb-2">{profile.username}</h1>
                <p className="text-[#99aabb]">Member since {new Date(profile.updated_at).getFullYear()}</p>

                <div className="flex gap-6 mt-6 justify-center md:justify-start">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{watchedCount}</div>
                        <div className="text-xs uppercase tracking-wider text-[#99aabb]">Episodes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">0</div>
                        <div className="text-xs uppercase tracking-wider text-[#99aabb]">Reviews</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{userLists?.length || 0}</div>
                        <div className="text-xs uppercase tracking-wider text-[#99aabb]">Lists</div>
                    </div>
                </div>
            </div>
        </div>

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
                <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4 border-b border-[#445566] pb-2">User Lists</h3>

                {userLists && userLists.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {userLists.map((list: any) => (
                            <Link key={list.id} href={`/lists/${list.id}`} className="block p-4 bg-[#1c2229] border border-[#445566] rounded hover:border-sky-blue transition-colors">
                                <h4 className="font-bold text-white mb-1">{list.name}</h4>
                                {list.description && <p className="text-sm text-[#99aabb] line-clamp-2 mb-2">{list.description}</p>}
                                <div className="flex items-center justify-between text-xs text-[#667788]">
                                    <span>{list.list_items?.[0]?.count || 0} items</span>
                                    {!list.is_public && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Private</span>}
                                </div>
                            </Link>
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
);
}
