'use client';

import { useState, useTransition } from 'react';
import { toggleFollow } from '@/app/actions/social';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();
    const { user } = useAuth();

    // Don't show button if not logged in or viewing own profile (handled by parent usually, but safety check)
    if (!user || user.id === targetUserId) return null;

    const handleToggle = () => {
        // Optimistic update
        const newState = !isFollowing;
        setIsFollowing(newState);

        startTransition(async () => {
            try {
                await toggleFollow(targetUserId, isFollowing);
            } catch (error) {
                // Revert on error
                setIsFollowing(!newState);
                console.error('Failed to toggle follow:', error);
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`
                px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 border shadow-lg
                ${isFollowing
                    ? 'bg-[#1c2229] hover:bg-[#2c3440] text-gray-300 border-[#445566]'
                    : 'bg-white hover:bg-gray-100 text-black border-transparent'
                }
            `}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserCheck className="w-4 h-4" /> Following
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" /> Follow
                </>
            )}
        </button>
    );
}
