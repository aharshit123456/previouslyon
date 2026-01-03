'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Upload, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

    // File states
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(formData.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(formData.banner_path);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const previewUrl = URL.createObjectURL(file);

        if (type === 'avatar') {
            setAvatarFile(file);
            setAvatarPreview(previewUrl);
        } else {
            setBannerFile(file);
            setBannerPreview(previewUrl);
        }
    };

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}-${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('ppf')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('ppf').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalAvatarUrl = formData.avatar_url;
            let finalBannerUrl = formData.banner_path;

            // Upload Avatar if changed
            if (avatarFile) {
                finalAvatarUrl = await uploadFile(avatarFile, 'avatar');
            }

            // Upload Banner if changed
            if (bannerFile) {
                finalBannerUrl = await uploadFile(bannerFile, 'banner');
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    bio: formData.bio,
                    location: formData.location,
                    website: formData.website,
                    avatar_url: finalAvatarUrl,
                    banner_path: finalBannerUrl,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1c2229] border border-[#445566] rounded-lg w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#99aabb] hover:text-white z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 border-b border-[#445566]">
                    <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Banner Upload */}
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Banner Image</label>
                        <div className="relative w-full h-32 bg-[#14181c] rounded border border-dashed border-[#445566] hover:border-sky-blue transition-colors group overflow-hidden">
                            {bannerPreview ? (
                                <Image src={bannerPreview} alt="Banner Preview" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : null}

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#99aabb]">
                                <Upload className="w-6 h-6 mb-1" />
                                <span className="text-xs">Click to upload banner</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'banner')}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        {formData.banner_path && !bannerFile && (
                            <div className="mt-2">
                                <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-1">Or manage URL directly</label>
                                <input
                                    type="text"
                                    value={formData.banner_path}
                                    onChange={e => setFormData({ ...formData, banner_path: e.target.value })}
                                    className="w-full bg-[#14181c] border border-[#445566] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-blue"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-full bg-[#14181c] border border-dashed border-[#445566] hover:border-sky-blue transition-colors group overflow-hidden shrink-0">
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="Avatar Preview" fill className="object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                            ) : null}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#99aabb]">
                                <Upload className="w-5 h-5" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'avatar')}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex-grow">
                            <label className="block text-xs uppercase tracking-wider text-[#99aabb] mb-2">Profile Picture</label>
                            <p className="text-xs text-[#667788] mb-2">Upload a square image for best results.</p>
                            {formData.avatar_url && !avatarFile && (
                                <input
                                    type="text"
                                    value={formData.avatar_url}
                                    onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                                    className="w-full bg-[#14181c] border border-[#445566] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-blue"
                                    placeholder="https://..."
                                />
                            )}
                        </div>
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
