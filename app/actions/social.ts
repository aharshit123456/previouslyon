'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function toggleFollow(targetUserId: string, isFollowing: boolean) {
    const supabase = await createClient();

    // Debug: Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[toggleFollow] Session:', session?.user?.id || 'No session', 'Error:', sessionError?.message);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[toggleFollow] User:', user?.id || 'No user', 'Error:', authError?.message);

    if (!user || authError) {
        console.error('Unauthorized detected in toggleFollow');
        throw new Error('Unauthorized');
    }

    if (isFollowing) {
        // Unfollow
        await supabaseAdmin
            .from('follows')
            .delete()
            .match({ follower_id: user.id, following_id: targetUserId });
    } else {
        // Follow
        await supabaseAdmin
            .from('follows')
            .insert({ follower_id: user.id, following_id: targetUserId });
    }

    // In a real app we'd revalidate specific paths, but for now simple cache invalidation
    revalidatePath(`/user/[username]`, 'page');
}

export async function getFollowStatus(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from('follows')
        .select('*')
        .match({ follower_id: user.id, following_id: targetUserId })
        .single();

    return !!data;
}
