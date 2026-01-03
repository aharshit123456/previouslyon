'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { User } from 'lucide-react';

interface ActivityItem {
    id: string; // user_id (not exactly unique for key but sufficient combined with timestamp if needed, or use row id if available)
    watched_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
    episodes: {
        season_number: number;
        episode_number: number;
        shows: {
            id: number;
            name: string;
            poster_path: string | null;
        };
    };
}

interface ActivityFeedProps {
    activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
    if (!activities || activities.length === 0) return null;

    return (
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-sky-blue">Friend</span> Activity
            </h2>
            <div className="space-y-4">
                {activities.map((item, i) => {
                    const { profiles, episodes } = item;
                    const show = episodes.shows;

                    return (
                        <div key={`${item.id}-${item.watched_at}-${i}`} className="flex gap-4 p-4 bg-[#14181c] rounded-lg border border-[#2c3440] hover:border-[#445566] transition-colors">
                            {/* User Avatar */}
                            <Link href={`/user/${profiles.username}`} className="shrink-0">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2c3440] relative border border-[#445566]">
                                    {profiles.avatar_url ? (
                                        <Image src={profiles.avatar_url} alt={profiles.username} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-[#99aabb]">
                                            <User className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="flex-grow">
                                <p className="text-sm text-[#99aabb] mb-2">
                                    <Link href={`/user/${profiles.username}`} className="text-white font-bold hover:underline">
                                        {profiles.username}
                                    </Link>
                                    {' '}watched an episode
                                    <span className="text-[#667788] text-xs ml-2">{new Date(item.watched_at).toLocaleDateString()}</span>
                                </p>

                                <div className="flex gap-3">
                                    <Link href={`/show/${show.id}`} className="shrink-0 w-12 aspect-[2/3] relative rounded overflow-hidden bg-black">
                                        {show.poster_path && (
                                            <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                                        )}
                                    </Link>
                                    <div>
                                        <Link href={`/show/${show.id}`} className="text-white font-bold hover:text-primary transition-colors block">
                                            {show.name}
                                        </Link>
                                        <div className="text-sm text-sky-blue">
                                            Season {episodes.season_number}, Episode {episodes.episode_number}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
