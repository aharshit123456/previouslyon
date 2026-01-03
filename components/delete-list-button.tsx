'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteListAction } from '@/app/actions/lists';
import { useRouter } from 'next/navigation';

export default function DeleteListButton({ listId }: { listId: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await deleteListAction(listId);
            // Redirect happens in server action, but good to have fallback/error handling UI
        } catch (error) {
            console.error(error);
            alert('Failed to delete list.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-200 text-xs font-bold uppercase tracking-wider rounded border border-red-900/50 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Delete List
        </button>
    );
}
