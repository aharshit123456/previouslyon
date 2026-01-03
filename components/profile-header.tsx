'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, MapPin, Link as LinkIcon, Calendar, Edit2, Play } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import EditProfileModal from './edit-profile-modal';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import FollowButton from './follow-button';

interface ProfileHeaderProps {
    profile: any;
    isOwnProfile: boolean;
    isFollowing?: boolean;
    stats: {
        watchedCount: number;
        listsCount: number;
        followersCount?: number;
        followingCount?: number;
    }
}

export default function ProfileHeader({ profile, isFollowing, stats }: ProfileHeaderProps) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const isOwnProfile = user?.id === profile.id;

    useEffect(() => {
        const editParam = searchParams.get('edit');
        if (isOwnProfile && editParam === 'true') {
            setIsEditOpen(true);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [isOwnProfile, searchParams]);

    const bannerUrl = profile.banner_path?.startsWith('/')
        ? getImageUrl(profile.banner_path, 'original')
        : profile.banner_path;

    return (
        <div className="relative mb-12">
            {/* Minimal Banner */}
            <div className="relative w-full h-[60vh] md:h-[500px] overflow-hidden bg-black">
                {bannerUrl ? (
                    <Image
                        src={bannerUrl}
                        alt="Banner"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-[#0e1114]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-transparent " />
            </div>

            {/* Profile Content Overlay */}
            <div className="container-custom relative -mt-32 md:-mt-48 z-20">
                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] md:gap-12 items-end">

                    {/* Avatar Column */}
                    <div className="relative mb-6 md:mb-0">
                        <div className="w-56 h-56 rounded-full border-8 border-[#14181c] overflow-hidden bg-[#1c2229] shadow-xl relative z-20 mx-auto md:mx-0">
                            {profile.avatar_url ? (
                                <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <User className="w-24 h-24" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats & Info Column */}
                    <div className="bg-[#1c2229] p-8 rounded-2xl shadow-xl flex-grow mb-4 md:mb-0 border border-[#2c3440]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 lowercase tracking-tighter">@{profile.username}</h1>
                                {profile.bio && <p className="text-gray-400 font-medium text-lg max-w-2xl leading-relaxed">{profile.bio}</p>}
                            </div>

                            <div className="flex shrink-0 gap-3">
                                {isOwnProfile ? (
                                    <button
                                        onClick={() => setIsEditOpen(true)}
                                        className="px-6 py-3 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <FollowButton targetUserId={profile.id} initialIsFollowing={!!isFollowing} />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#2c3440] pt-6">
                            <div>
                                <span className="block text-3xl font-black text-white">{stats.watchedCount}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Episodes</span>
                            </div>
                            <div>
                                <span className="block text-3xl font-black text-white">{stats.listsCount}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lists</span>
                            </div>
                            <div>
                                <span className="block text-3xl font-black text-white">{stats.followersCount || 0}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Followers</span>
                            </div>
                            <div>
                                <span className="block text-3xl font-black text-white">{stats.followingCount || 0}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Following</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-[#2c3440] text-sm font-medium text-gray-400">
                            {profile.location && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-white" /> {profile.location}
                                </span>
                            )}
                            {profile.website && (
                                <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                    <LinkIcon className="w-4 h-4 text-white" /> {profile.website}
                                </a>
                            )}
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-white" /> Joined {new Date(profile.updated_at).getFullYear()}
                            </span>
                        </div>
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
