'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Star, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/components/auth-provider';

interface ReviewModalProps {
    entityType: 'episode' | 'season' | 'show';
    entityId: number;
    entityName: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    // New fields for Smart Schema
    showId?: number;
    seasonNumber?: number;
    episodeNumber?: number;
}

export default function ReviewModal({
    entityType,
    entityId,
    entityName,
    isOpen,
    onClose,
    onSubmit,
    showId,
    seasonNumber,
    episodeNumber
}: ReviewModalProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        // Basic insert, RLS protects it
        const { error } = await supabase
            .from('reviews')
            .insert([{
                user_id: user.id,
                entity_type: entityType,
                entity_id: entityId,
                rating,
                body,
                // Smart Schema Fields
                show_id: showId,
                season_number: seasonNumber,
                episode_number: episodeNumber
            }]);

        if (!error) {
            setBody('');
            setRating(0);
            onSubmit();
            onClose();
        } else {
            console.error(error);
            alert('Failed to post review');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-[#1c2229] border border-[#445566] rounded shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#99aabb] hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6">
                    <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-2">Reviewing</h3>
                    <h2 className="text-xl font-bold text-white mb-6">{entityName}</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-[#99aabb] mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={clsx(
                                            "w-6 h-6 transition-colors",
                                            star <= rating ? "text-primary fill-primary" : "text-[#445566] hover:text-primary"
                                        )}
                                    >
                                        <Star className={clsx("w-full h-full", star <= rating && "fill-current")} />
                                    </button>
                                ))}
                                <span className="ml-2 text-white font-bold">{rating}/10</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#99aabb] mb-2">Review</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="w-full h-32 bg-[#2c3440] border border-[#445566] rounded p-3 text-white focus:outline-none focus:border-primary resize-none"
                                placeholder="Add a review..."
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-white hover:text-[#99aabb] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || rating === 0}
                                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
