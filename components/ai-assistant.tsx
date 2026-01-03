'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { getAIRecommendations } from '@/app/actions/ai';
import { fetchShowsByIds } from '@/app/actions/tmdb';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/tmdb';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIAssistant() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResponse('');
        setRecommendations([]);

        try {
            // 1. Get AI Recommendation (JSON with text + IDs)
            const result = await getAIRecommendations(query);

            if (result.response) {
                setResponse(result.response);
            }

            // 2. Fetch full show details if we have codes
            if (result.codes && result.codes.length > 0) {
                const shows = await fetchShowsByIds(result.codes);
                setRecommendations(shows);
            }

        } catch (error) {
            console.error("AI Error:", error);
            setResponse("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-gradient-to-b from-[#1c2229] to-[#14181c] rounded-xl border border-[#445566]/50 overflow-hidden shadow-2xl mb-12 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-sky-blue/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-tr from-primary to-sky-blue rounded-lg shadow-lg">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        AI Personal Assistant
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="relative mb-8 group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask for a recommendation (e.g., 'Sitcoms like The Office' or '90s Sci-Fi')..."
                        className="w-full bg-[#0d1116] text-[#e0e6ed] placeholder-[#99aabb] rounded-xl py-4 pl-5 pr-14 border border-[#445566] focus:border-sky-blue focus:ring-1 focus:ring-sky-blue transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#2c3440] hover:bg-primary text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-[#2c3440]"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>

                <AnimatePresence mode="wait">
                    {(response || loading) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Text Response */}
                            {response && (
                                <div className="prose prose-invert max-w-none">
                                    <div className="flex gap-4 items-start bg-[#16202a] p-5 rounded-xl border border-[#2d3845]">
                                        <div className="shrink-0 p-2 rounded-full bg-[#1c2836]">
                                            <Sparkles className="w-4 h-4 text-sky-blue" />
                                        </div>
                                        <p className="text-[#cdd7e1] leading-relaxed text-sm md:text-base">
                                            {response}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations Grid */}
                            {recommendations.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {recommendations.map((show) => (
                                        <Link
                                            key={show.id}
                                            href={`/show/${show.id}`}
                                            className="block group relative aspect-[2/3] bg-[#0d1116] rounded-lg overflow-hidden border border-[#2d3845] hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                        >
                                            {show.poster_path ? (
                                                <Image
                                                    src={getImageUrl(show.poster_path)}
                                                    alt={show.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                                                    No Image
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <p className="text-sm font-medium text-white line-clamp-2">
                                                    {show.name}
                                                </p>
                                                <div className="text-xs text-primary mt-1 flex items-center gap-1">
                                                    <span>View Details</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
