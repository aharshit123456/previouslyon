'use client';

// Mobile/Desktop Responsive Navbar
import { useState } from 'react';
import Link from "next/link";
import { Search, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from "@/components/auth-provider";

export default function Navbar() {
    const { user, profile, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-[#14181c] border-b border-[#445566] py-3">
            <div className="container-custom flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group z-50">
                    <div className="relative w-6 h-6 bg-sky-blue rounded p-1">
                        <img src="/stage-theatre.svg" alt="Logo" className="w-full h-full object-contain invert" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white lowercase group-hover:text-sky-blue transition-colors">
                        previously<span className="text-sky-blue group-hover:text-white">on</span>
                    </span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white z-50"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-bold lowercase tracking-wide text-pastel-petal">
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
                        <form action="/search" className="relative group">
                            <Search className="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 text-[#99aabb] group-focus-within:text-sky-blue transition-colors pointer-events-none" />
                            <input
                                type="text"
                                name="q"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none pl-8 w-24 focus:w-48 transition-all text-white placeholder-gray-500 text-sm"
                            />
                        </form>
                    </div>
                </nav>

                {/* Mobile Nav Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 bg-[#14181c] z-40 flex flex-col pt-24 px-6 md:hidden">
                        <div className="flex flex-col gap-6 text-xl font-bold lowercase tracking-wide text-pastel-petal">
                            <form action="/search" className="relative group mb-4">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#99aabb]" />
                                <input
                                    type="text"
                                    name="q"
                                    placeholder="Search shows..."
                                    className="w-full bg-[#1c2229] border border-[#445566] rounded p-3 pl-10 text-white focus:outline-none focus:border-sky-blue"
                                />
                            </form>

                            {user ? (
                                <>
                                    <Link href="/shows" onClick={() => setIsMenuOpen(false)} className="hover:text-sky-blue transition-colors border-b border-[#2c3440] pb-4">shows</Link>
                                    <Link href="/lists" onClick={() => setIsMenuOpen(false)} className="hover:text-sky-blue transition-colors border-b border-[#2c3440] pb-4">lists</Link>
                                    {profile?.username && (
                                        <Link href={`/user/${profile.username}`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-sky-blue hover:text-white transition-colors border-b border-[#2c3440] pb-4">
                                            <UserIcon className="w-5 h-5" /> Profile ({profile.username})
                                        </Link>
                                    )}
                                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-baby-pink hover:text-white transition-colors text-left pt-2">
                                        <LogOut className="w-5 h-5" /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/signin" onClick={() => setIsMenuOpen(false)} className="hover:text-sky-blue transition-colors border-b border-[#2c3440] pb-4">sign in</Link>
                                    <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="hover:text-sky-blue transition-colors">create account</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
