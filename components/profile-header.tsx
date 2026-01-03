'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, MapPin, Link as LinkIcon, Calendar, Edit2 } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import EditProfileModal from './edit-profile-modal';

interface ProfileHeaderProps {
    profile: any; // Using any for now to match flexible DB type or define interface
    isOwnProfile: boolean;
    stats: {
        watchedCount: number;
        listsCount: number;
    }
}

export default function ProfileHeader({ profile, isOwnProfile, stats }: ProfileHeaderProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Determine banner image: custom URL, TMDB path, or default gradient
    const bannerUrl = profile.banner_path?.startsWith('/')
        ? getImageUrl(profile.banner_path, 'original')
        : profile.banner_path;

    return (
        <div className="relative mb-10">
            {/* Banner */}
            <div className="relative w-full h-[300px] bg-[#14181c] overflow-hidden group">
                {bannerUrl ? (
                    <Image
                        src={bannerUrl}
                        alt="Banner"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-sky-blue/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1114] to-transparent" />
            </div>

            {/* Profile Info Overlay */}
            <div className="container-custom relative -mt-32 flex flex-col md:flex-row gap-8 items-end md:items-end">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-40 h-40 rounded-full border-4 border-[#0e1114] overflow-hidden bg-[#2c3440] shadow-2xl relative z-10">
                        {profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[#99aabb]">
                                <User className="w-20 h-20" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-grow pb-4 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 shadow-black/50 drop-shadow-md">{profile.username}</h1>
                            {profile.bio && <p className="text-gray-300 max-w-xl mb-4 text-lg leading-relaxed">{profile.bio}</p>}

                            <div className="flex flex-wrap gap-4 text-sm text-[#99aabb] justify-center md:justify-start">
                                {profile.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-primary" /> {profile.location}
                                    </span>
                                )}
                                {profile.website && (
                                    <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                        <LinkIcon className="w-4 h-4 text-sky-blue" /> {profile.website}
                                    </a>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" /> Joined {new Date(profile.updated_at).getFullYear()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        {isOwnProfile && (
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="px-4 py-2 bg-[#2c3440] hover:bg-[#3c4656] text-white rounded-lg font-medium transition-colors flex items-center gap-2 border border-[#445566] shadow-lg"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="container-custom mt-8">
                <div className="flex gap-8 justify-center md:justify-start border-t border-b border-[#1c2229] py-6">
                    <div className="text-center md:text-left">
                        <span className="block text-2xl font-bold text-white">{stats.watchedCount}</span>
                        <span className="text-xs uppercase tracking-wider text-[#99aabb]">Episodes</span>
                    </div>
                    <div className="text-center md:text-left">
                        <span className="block text-2xl font-bold text-white">{stats.listsCount}</span>
                        <span className="text-xs uppercase tracking-wider text-[#99aabb]">Lists</span>
                    </div>
                    <div className="text-center md:text-left">
                        <span className="block text-2xl font-bold text-white">0</span>
                        <span className="text-xs uppercase tracking-wider text-[#99aabb]">Reviews</span>
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <EditProfileModal
                    profile={profile}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                />
            )}
        </div>
    );
}
