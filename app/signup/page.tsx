'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // Profile will be created by Database Trigger (see db_schema.sql)

        router.push('/');
        router.refresh();
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 bg-[#1c2229] rounded border border-[#445566]">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">Join PreviouslyOn</h1>

                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[#99aabb] mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white focus:outline-none focus:border-primary"
                            required
                            minLength={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#99aabb] mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white focus:outline-none focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#99aabb] mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white focus:outline-none focus:border-primary"
                            required
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-[#99aabb]">
                    Already have an account? <Link href="/signin" className="text-white hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
