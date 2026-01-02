'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export default function SetupProfile() {
    const { user } = useAuth();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, username, updated_at: new Date() }]);

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
        } else {
            // Force reload to update context
            window.location.href = `/user/${username}`;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 bg-[#1c2229] rounded border border-[#445566]">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Complete Your Profile</h1>
                <p className="text-[#99aabb] mb-6 text-center text-sm">You are signed in, but you need a username to track shows.</p>

                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSetup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#99aabb] mb-1">Choose Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white focus:outline-none focus:border-primary"
                            required
                            minLength={3}
                            placeholder="e.g. moviebuff22"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}
