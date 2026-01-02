'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface ShowFiltersProps {
    genres: { id: number; name: string }[];
}

export default function ShowFilters({ genres }: ShowFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Helper to update URL params
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            // Reset page on filter change
            if (name !== 'page') params.delete('page');

            return params.toString();
        },
        [searchParams]
    );

    const handleFilterChange = (name: string, value: string) => {
        router.push(`/shows?${createQueryString(name, value)}`);
    };

    const currentSort = searchParams.get('sort_by') || 'popularity.desc';
    const currentGenre = searchParams.get('with_genres') || '';
    const currentYear = searchParams.get('first_air_date_year') || '';

    return (
        <div className="bg-[#1c2229] border border-[#445566] rounded p-4 h-fit sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-white font-bold border-b border-[#445566] pb-2">
                <SlidersHorizontal className="w-5 h-5" /> Filters
            </div>

            {/* Sort */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#99aabb] uppercase tracking-wider mb-2">Sort By</label>
                <select
                    value={currentSort}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white text-sm focus:outline-none focus:border-sky-blue"
                >
                    <option value="popularity.desc">Popularity (High to Low)</option>
                    <option value="popularity.asc">Popularity (Low to High)</option>
                    <option value="vote_average.desc">Rating (High to Low)</option>
                    <option value="first_air_date.desc">Newest First</option>
                    <option value="first_air_date.asc">Oldest First</option>
                </select>
            </div>

            {/* Year */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-[#99aabb] uppercase tracking-wider mb-2">Year</label>
                <input
                    type="number"
                    placeholder="e.g. 2023"
                    value={currentYear}
                    onChange={(e) => handleFilterChange('first_air_date_year', e.target.value)}
                    className="w-full bg-[#2c3440] border border-[#445566] rounded p-2 text-white text-sm focus:outline-none focus:border-sky-blue"
                />
            </div>

            {/* Genres */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#99aabb] uppercase tracking-wider">Genre</label>
                    {currentGenre && (
                        <button
                            onClick={() => handleFilterChange('with_genres', '')}
                            className="text-[10px] text-baby-pink hover:underline flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>

                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {genres.map(genre => (
                        <button
                            key={genre.id}
                            onClick={() => handleFilterChange('with_genres', genre.id.toString())}
                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${currentGenre === genre.id.toString()
                                    ? 'bg-sky-blue text-black font-bold'
                                    : 'text-gray-300 hover:bg-[#2c3440] hover:text-white'
                                }`}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
