'use client';

// Mobile/Desktop Responsive Navbar
import { useState } from 'react';
import Link from "next/link";
import { Search, User as UserIcon, LogOut, Menu, X, Settings } from 'lucide-react';
import { useAuth } from "@/components/auth-provider";

export default function Navbar() {
    const { user, profile, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-[#14181c]/90 backdrop-blur-md border-b border-[#2c3440] py-5">
            <div className="container-custom flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group z-50">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                        <img src="/icon.svg" alt="Logo" className="w-full h-full object-contain invert" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white uppercase group-hover:text-primary transition-colors">
                        Previously<span className="text-primary group-hover:text-white">On</span>
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
                <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-[#99aabb]">
                    {user ? (
                        <>
                            <Link href="/shows" className="hover:text-white transition-colors">Shows</Link>
                            <Link href="/lists" className="hover:text-white transition-colors">Lists</Link>
                            <div className="flex items-center gap-4 ml-4">
                                {profile?.username && (
                                    <>
                                        <Link href={`/user/${profile.username}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                                            <UserIcon className="w-4 h-4" /> {profile.username}
                                        </Link>
                                    </>
                                )}
                                <button onClick={() => signOut()} className="hover:text-red-500 transition-colors border-l border-[#2c3440] pl-4 ml-2">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/signin" className="hover:text-white transition-colors">Log In</Link>
                            <Link href="/signup" className="px-6 py-3 bg-[#fbbf24] text-black font-bold uppercase tracking-wider rounded-full hover:bg-[#f59e0b] transition-colors shadow-[0_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                                Subscribe
                            </Link>
                        </>
                    )}

                    <div className="border-l border-[#2c3440] pl-6 ml-2">
                        <form action="/search" className="relative group">
                            <Search className="w-5 h-5 absolute left-0 top-1/2 -translate-y-1/2 text-[#99aabb] group-focus-within:text-white transition-colors pointer-events-none" />
                            <input
                                type="text"
                                name="q"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none pl-8 w-32 focus:w-48 transition-all text-white placeholder-[#4c5566] text-sm font-medium"
                            />
                        </form>
                    </div>
                </nav>

                {/* Mobile Nav Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 bg-[#14181c] z-[100] flex flex-col pt-28 px-8 md:hidden overflow-y-auto">
                        <button
                            className="absolute top-6 right-4 text-white p-2"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="flex flex-col gap-8 text-xl font-black uppercase tracking-tight text-white">
                            <form action="/search" className="relative group mb-4">
                                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="q"
                                    placeholder="SEARCH SHOWS..."
                                    className="w-full bg-[#1c2229] border border-[#2c3440] rounded-2xl p-4 pl-12 text-white font-bold focus:ring-2 focus:ring-primary placeholder-gray-500"
                                />
                            </form>

                            {user ? (
                                <>
                                    <Link href="/shows" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors border-b border-[#2c3440] pb-4">Shows</Link>
                                    <Link href="/lists" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors border-b border-[#2c3440] pb-4">Lists</Link>
                                    {profile?.username && (
                                        <Link href={`/user/${profile.username}`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 hover:text-primary transition-colors border-b border-[#2c3440] pb-4">
                                            <UserIcon className="w-6 h-6" /> Profile
                                        </Link>
                                    )}
                                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors pt-4">
                                        <LogOut className="w-6 h-6" /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/signin" onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors border-b border-[#2c3440] pb-4">Log In</Link>
                                    <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="text-primary hover:text-orange-600 transition-colors">Create Account</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header >
    );
}
