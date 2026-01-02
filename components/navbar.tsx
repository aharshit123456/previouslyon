'use client';

import Link from "next/link";
import { Search, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from "@/components/auth-provider";

export default function Navbar() {
    const { user, profile, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-[#14181c] border-b border-[#445566] py-3">
            <div className="container-custom flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-6 h-6 bg-sky-blue rounded p-1">
                        <img src="/stage-theatre.svg" alt="Logo" className="w-full h-full object-contain invert" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white lowercase group-hover:text-sky-blue transition-colors">
                        previously<span className="text-sky-blue group-hover:text-white">on</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6 text-sm font-bold lowercase tracking-wide text-pastel-petal">
                    {user ? (
                        <>
                            <Link href="/shows" className="hover:text-sky-blue transition-colors">shows</Link>
                            <Link href="/lists" className="hover:text-sky-blue transition-colors">lists</Link>
                            <div className="flex items-center gap-4 ml-2">
                                {profile?.username && (
                                    <Link href={`/user/${profile.username}`} className="flex items-center gap-2 text-sky-blue hover:text-white transition-colors">
                                        <UserIcon className="w-4 h-4" /> {profile.username}
                                    </Link>
                                )}
                                <button onClick={() => signOut()} className="flex items-center gap-2 text-baby-pink hover:text-white transition-colors">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/signin" className="hover:text-sky-blue transition-colors">sign in</Link>
                            <Link href="/signup" className="hover:text-sky-blue transition-colors">create account</Link>
                        </>
                    )}

                    <div className="text-pastel-petal border-l border-[#445566] pl-4 ml-2">
                        <Search className="w-5 h-5 cursor-pointer hover:text-sky-blue transition-colors" />
                    </div>
                </nav>
            </div>
        </header>
    );
}
