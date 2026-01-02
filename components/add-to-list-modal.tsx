'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';

interface AddToListModalProps {
    show: { id: number; name: string; poster_path: string | null; first_air_date: string };
    isOpen: boolean;
    onClose: () => void;
}

export default function AddToListModal({ show, isOpen, onClose }: AddToListModalProps) {
    const { user } = useAuth();
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchLists();
        }
    }, [isOpen, user]);

    const fetchLists = async () => {
        if (!user) return;
        setLoading(true);
        // Fetch user lists and check if show is already in them
        // We need a way to check membership. 
        // 1. Fetch Lists
        const { data: userLists } = await supabase.from('lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

        // 2. Fetch memberships for this show
        if (userLists) {
            const { data: items } = await supabase.from('list_items').select('list_id').eq('show_id', show.id);
            const listIdsContainingShow = new Set(items?.map(i => i.list_id));

            setLists(userLists.map(l => ({ ...l, hasShow: listIdsContainingShow.has(l.id) })));
        }
        setLoading(false);
    };

    const toggleList = async (listId: number, hasShow: boolean) => {
        setActionLoading(listId);

        if (hasShow) {
            // Remove
            await supabase.from('list_items').delete().eq('list_id', listId).eq('show_id', show.id);
        } else {
            // Add - First ensure show exists in DB (Show Cache Upsert)
            await supabase
                .from('shows')
                .upsert({
                    id: show.id,
                    name: show.name,
                    poster_path: show.poster_path,
                    first_air_date: show.first_air_date
                }, { onConflict: 'id' });

            await supabase.from('list_items').insert([{ list_id: listId, show_id: show.id }]);
        }

        // Update Local State
        setLists(prev => prev.map(l => l.id === listId ? { ...l, hasShow: !hasShow } : l));
        setActionLoading(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#1c2229] border border-[#445566] rounded shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#99aabb] hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6">
                    <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-2">Add to List</h3>
                    <h2 className="text-xl font-bold text-white mb-6 line-clamp-1">{show.name}</h2>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                        {loading ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : lists.length > 0 ? (
                            lists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => toggleList(list.id, list.hasShow)}
                                    disabled={actionLoading === list.id}
                                    className="w-full flex items-center justify-between p-3 rounded hover:bg-[#2c3440] transition-colors text-left group"
                                >
                                    <span className="text-white font-medium group-hover:text-primary transition-colors">{list.name}</span>
                                    {actionLoading === list.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#99aabb]" />
                                    ) : list.hasShow ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Plus className="w-4 h-4 text-[#445566] group-hover:text-white" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-4 text-[#99aabb] text-sm">
                                You don't have any lists yet.
                            </div>
                        )}
                    </div>

                    <Link href="/lists/new" className="block w-full py-2 text-center text-sm font-bold text-primary hover:underline border-t border-[#445566] pt-4">
                        + Create New List
                    </Link>
                </div>
            </div>
        </div>
    );
}
