'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function NewListPage() {
    const { user, profile } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('lists')
            .insert([{
                user_id: user.id,
                name,
                description,
                is_public: isPublic
            }])
            .select()
            .single();

        if (error) {
            alert('Failed to create list: ' + error.message);
            setLoading(false);
        } else {
            router.push(`/lists/${data.id}`);
            router.refresh();
        }
    };

    return (
        <div className="container-custom py-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Create a New List</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-[#1c2229] p-8 rounded border border-[#445566]">
                <div>
                    <label className="block text-sm font-bold text-[#99aabb] mb-2">Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#2c3440] border border-[#445566] rounded p-3 text-white focus:outline-none focus:border-primary"
                        required
                        placeholder="e.g. Best Sci-Fi Shows"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-[#99aabb] mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-32 bg-[#2c3440] border border-[#445566] rounded p-3 text-white focus:outline-none focus:border-primary resize-none"
                        placeholder="What is this list about?"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="public"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#2c3440] border-[#445566] text-primary focus:ring-primary"
                    />
                    <label htmlFor="public" className="text-white text-sm">Make this list public</label>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || !name}
                        className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create List
                    </button>
                </div>
            </form>
        </div>
    );
}
