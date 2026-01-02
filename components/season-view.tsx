'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import { Check, Calendar, Clock, Loader2, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import ReviewModal from './review-modal';

interface Episode {
    id: number;
    name: string;
    episode_number: number;
    overview: string;
    still_path: string | null;
    air_date: string;
    runtime: number;
    vote_average: number;
}

interface SeasonViewProps {
    show: {
        id: number;
        name: string;
        poster_path: string | null;
        first_air_date: string;
    };
    seasonNumber: number;
    episodes: Episode[];
}

export default function SeasonView({ show: showProp, seasonNumber, episodes }: SeasonViewProps) {
    const { user, session } = useAuth();
    const [watchedIds, setWatchedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchProgress = async () => {
            // Get all episode IDs for this season
            const episodeIds = episodes.map(e => e.id);

            // Fetch rows from user_episode_progress where episode_id in (episodeIds)
            // Since Supabase doesn't support "WHERE IN" easily for array of numbers in simple query sometimes, 
            // we can filter by querying local cache or just fetching * for this user and show.
            // Or simpler: just select episode_id from user_episode_progress where user_id = me
            // We will assume the list isn't huge for now.

            const { data, error } = await supabase
                .from('user_episode_progress')
                .select('episode_id')
                .eq('user_id', user.id)
                .in('episode_id', episodeIds);

            if (data) {
                setWatchedIds(new Set(data.map(row => row.episode_id)));
            }
            setLoading(false);
        };

        fetchProgress();
    }, [user, episodes, showProp.id]);

    // We need show details for the API upsert
    // Since we only get showId in props, we might need to pass partial show data or fetch it.
    // BUT the API needs show data to upsert.
    // Ideally SeasonView should receive the basic show info { id, name, poster_path, first_air_date }
    // For now, let's assume we pass it or we fetch it.
    // Refactoring: SeasonView should take `show` object.

    const toggleWatch = async (episodeId: number) => {
        if (!user || !session) {
            alert("Please sign in to track progress.");
            return;
        }

        setActionLoading(episodeId);

        const isWatched = watchedIds.has(episodeId);
        const action = isWatched ? 'unwatch' : 'watch';

        // Find the episode object
        const episode = episodes.find(e => e.id === episodeId);
        if (!episode) return;

        // We need show details. We can pass them as props or construct minimal dummy if we trust the API to eventually fetch real data 
        // (but my API expects data). 
        // Hack for POC: I will pass `show` as a prop to SeasonView.

        try {
            const res = await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    show: showProp, // Using the prop we will add
                    episode: { ...episode, show_id: showProp.id },
                    action
                })
            });

            if (res.ok) {
                const next = new Set(watchedIds);
                if (action === 'watch') next.add(episodeId);
                else next.delete(episodeId);
                setWatchedIds(next);
            } else {
                console.error("Tracking failed");
            }
        } catch (e) {
            console.error(e);
        }

        setActionLoading(null);
    };

    // State for Review Modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewingEpisode, setReviewingEpisode] = useState<{ id: number, name: string } | null>(null);

    const openReview = (episode: Episode) => {
        setReviewingEpisode({ id: episode.id, name: episode.name });
        setReviewModalOpen(true);
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-4">
                {episodes?.map((episode) => {
                    const isWatched = watchedIds.has(episode.id);
                    const isLoading = actionLoading === episode.id;

                    return (
                        <div key={episode.id} className={clsx(
                            "flex gap-4 p-4 rounded border transition-all",
                            isWatched
                                ? "bg-[#1c2229]/50 border-primary/30"
                                : "bg-[#1c2229] border-[#445566] hover:border-[#556677]"
                        )}>
                            <div className="relative w-32 aspect-video shrink-0 bg-black rounded overflow-hidden mt-1 relative group">
                                {episode.still_path ? (
                                    <Image src={getImageUrl(episode.still_path)} alt={episode.name} fill className={clsx("object-cover transition-opacity", isWatched && "opacity-50")} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-600">No Image</div>
                                )}

                                {/* Overlay Icon for Watched */}
                                {isWatched && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className="w-8 h-8 text-primary drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[#99aabb] font-mono text-sm">{episode.episode_number}.</span>
                                            <h4 className={clsx("font-bold text-lg leading-tight", isWatched ? "text-[#99aabb]" : "text-white")}>{episode.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#99aabb] mb-2">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {episode.air_date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {episode.runtime}m</span>
                                            <span className="flex items-center gap-1">★ {episode.vote_average.toFixed(1)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openReview(episode)}
                                            className="text-[#445566] hover:text-white p-2 rounded-full hover:bg-[#2c3440] transition-colors"
                                            title="Review Episode"
                                        >
                                            <span className="text-xl leading-none">💬</span>
                                            {/* Using emoji for now to save icon import bloat, or insert MessageCircle logic if preferred */}
                                        </button>

                                        <button
                                            onClick={() => toggleWatch(episode.id)}
                                            disabled={isLoading}
                                            className={clsx(
                                                "p-2 rounded-full transition-colors group",
                                                isWatched
                                                    ? "text-primary hover:bg-red-500/20 hover:text-red-500 bg-primary/10"
                                                    : "text-[#445566] hover:text-white bg-[#2c3440] hover:bg-primary"
                                            )}
                                            title={isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 line-clamp-2">{episode.overview}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {reviewingEpisode && (
                <ReviewModal
                    entityType="episode"
                    entityId={reviewingEpisode.id}
                    entityName={reviewingEpisode.name}
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    onSubmit={() => {
                        // Could refresh reviews list if we showed them inline
                    }}
                />
            )}
        </>
    );
}
