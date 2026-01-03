'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteListAction(listId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Check ownership
    const { data: list } = await supabase
        .from('lists')
        .select('user_id')
        .eq('id', listId)
        .single();

    if (!list || list.user_id !== user.id) {
        throw new Error('Unauthorized: You do not own this list');
    }

    // 2. Delete List (Cascade should handle items, but if not we might need to delete list_items first)
    // Assuming DB schema has ON DELETE CASCADE for foreign keys on list_items
    const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId);

    if (error) {
        console.error('Delete List Error:', error);
        throw new Error('Failed to delete list');
    }

    revalidatePath('/lists');
    revalidatePath(`/user`); // Invalidate user profile potentially
    redirect('/lists');
}
