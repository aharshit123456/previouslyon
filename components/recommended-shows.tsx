'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import { fetchRecommendationsAction } from '@/app/actions/tmdb';
import Link from 'next/link';
import Image from 'next/image';

export default function RecommendedShows() {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            console.log("[RecommendedShows] Checking session...");
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                console.log("[RecommendedShows] No user session found.");
                setLoading(false);
                return;
            }

            console.log("[RecommendedShows] User found:", session.user.id);

            // 1. Get user's shows
            const { data: userListItems, error } = await supabase
                .from('list_items')
                .select('show_id, lists!inner(user_id)')
                .eq('lists.user_id', session.user.id);

            if (error) {
                console.error("[RecommendedShows] Error fetching list items:", error);
                setLoading(false);
                return;
            }

            const userShowIds = userListItems?.map((item: any) => item.show_id) || [];
            console.log(`[RecommendedShows] User has ${userShowIds.length} shows in lists.`);

            if (userShowIds.length > 2) {
                // 3. Pick random source shows
                const shuffled = [...userShowIds].sort(() => 0.5 - Math.random());
                const sourceIds = shuffled.slice(0, 3);
                console.log("[RecommendedShows] Source IDs for recs:", sourceIds);

                try {
                    const promises = sourceIds.map((id: number) => fetchRecommendationsAction(id));
                    const results = await Promise.all(promises);

                    const allRecs = results.flatMap((r: any) => r.results || []);
                    const uniqueRecs = new Map();

                    allRecs.forEach((show: any) => {
                        if (!userShowIds.includes(show.id)) {
                            uniqueRecs.set(show.id, show);
                        }
                    });

                    const finalRecs = Array.from(uniqueRecs.values())
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 10);

                    console.log(`[RecommendedShows] Found ${finalRecs.length} unique recommendations.`);
                    setRecs(finalRecs);
                } catch (e) {
                    console.error("[RecommendedShows] Error fetching TMDB recs:", e);
                }
            } else {
                console.log("[RecommendedShows] Not enough shows to recommend (need > 2).");
            }
            setLoading(false);
        };

        fetchRecommendations();
    }, []);

    if (loading || recs.length === 0) return null;

    return (
        <section className="container-custom mt-10">
            <h2 className="text-xl font-normal border-b border-[#445566] pb-2 mb-4 text-sky-blue uppercase tracking-wider">
                Recommended For You
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {recs.map((show: any) => (
                    <Link key={show.id} href={`/show/${show.id}`} className="group relative block aspect-[2/3] bg-[#2c3440] rounded overflow-hidden card-hover">
                        {show.poster_path ? (
                            <Image
                                src={getImageUrl(show.poster_path)}
                                alt={show.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 33vw, 20vw"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-center p-2 text-xs text-gray-500">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <span className="text-white text-center font-semibold text-sm">{show.name}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
