'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    username: string;
    avatar_url: string | null;
};

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            // Check for existing session first
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            if (initialSession) {
                setSession(initialSession);
                setUser(initialSession.user);
                await fetchProfile(initialSession.user.id);
            }
            setLoading(false);

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
                console.log(`[AuthProvider] Auth Event: ${event}`);
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user && event !== 'INITIAL_SESSION') {
                    // We only need to fetch if it's a new sign in or explicit change
                    // avoiding double fetch if initialSession already covered it.
                    // But for safety, we often just fetch if we don't have a profile yet or user changed.
                    await fetchProfile(currentSession.user.id);
                } else if (!currentSession) {
                    setProfile(null);
                }

                setLoading(false);
            });

            return subscription;
        };

        const fetchProfile = async (userId: string) => {
            console.log("[AuthProvider] Fetching profile for:", userId);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    console.error("[AuthProvider] Error fetching profile:", error);
                } else if (data) {
                    console.log("[AuthProvider] Profile loaded.");
                    setProfile(data);
                } else {
                    console.warn("[AuthProvider] Profile missing for user.");
                    setProfile(null);
                }
            } catch (err) {
                console.error("[AuthProvider] Profile fetch exception:", err);
            }
        };

        const subPromise = initializeAuth();

        return () => {
            subPromise.then(sub => sub?.unsubscribe());
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
