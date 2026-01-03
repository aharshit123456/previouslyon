'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    banner_path: string | null;
    location: string | null;
    website: string | null;
}

interface EditProfileModalProps {
    profile: Profile;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditProfileModal({ profile, isOpen, onClose }: EditProfileModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || '',
        banner_path: profile.banner_path || ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    avatar_url: formData.avatar_url, // For now, simple URL input
                    banner_path: formData.banner_path,
                    updated_at: new Date()
                })
                .eq('id', profile.id);

            if (error) throw error;

            router.refresh();
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1c2229] border border-[#445566] rounded-lg w-full max-w-lg shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#99aabb] hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 border-b border-[#445566]">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Avatar URL</label>
                        <input
                            type="text"
                            value={formData.avatar_url}
                            onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                            className="w-full bg-[#14181c] border border-[#445566] rounded px-4 py-2 text-white focus:outline-none focus:border-sky-blue placeholder-gray-600"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-[#667788] mt-1">Direct link to an image.</p>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Banner URL</label>
                        <input
                            type="text"
                            value={formData.banner_path}
                            onChange={e => setFormData({ ...formData, banner_path: e.target.value })}
                            className="w-full bg-[#14181c] border border-[#445566] rounded px-4 py-2 text-white focus:outline-none focus:border-sky-blue placeholder-gray-600"
                            placeholder="https://... or TMDB Backdrop Path"
                        />
                        <p className="text-xs text-[#667788] mt-1">TMDB path (e.g. /path.jpg) or full URL.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full bg-[#14181c] border border-[#445566] rounded px-4 py-2 text-white focus:outline-none focus:border-sky-blue"
                                placeholder="New York, NY"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Website</label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => setFormData({ ...formData, website: e.target.value })}
                                className="w-full bg-[#14181c] border border-[#445566] rounded px-4 py-2 text-white focus:outline-none focus:border-sky-blue"
                                placeholder="yoursite.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full bg-[#14181c] border border-[#445566] rounded px-4 py-2 text-white focus:outline-none focus:border-sky-blue min-h-[100px]"
                            placeholder="Tell us about your TV taste..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-[#99aabb] hover:text-white font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-white font-bold rounded hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
