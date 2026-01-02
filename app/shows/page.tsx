import { discoverTV, getTVGenres, getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import ShowFilters from '@/components/show-filters';

export default async function ShowsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
    const params = await searchParams;

    // Fetch Data in Parallel
    const [showsData, genresData] = await Promise.all([
        discoverTV(params),
        getTVGenres()
    ]);

    const shows = showsData.results || [];
    const genres = genresData.genres || [];

    return (
        <div className="container-custom py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Browse Shows</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
                {/* Filters Sidebar */}
                <div className="hidden lg:block">
                    <ShowFilters genres={genres} />
                </div>

                {/* Mobile Filter Toggle (Simple version: just show component stacked for now on mobile, or hidden behind detail/accordion) */}
                <div className="lg:hidden mb-6">
                    <details className="bg-[#1c2229] border border-[#445566] rounded p-4">
                        <summary className="font-bold text-white cursor-pointer">Filters</summary>
                        <div className="mt-4">
                            <ShowFilters genres={genres} />
                        </div>
                    </details>
                </div>

                {/* Results Grid */}
                <div>
                    {shows.length === 0 ? (
                        <div className="text-center py-20 bg-[#1c2229] border border-[#445566] rounded">
                            <p className="text-[#99aabb] text-lg">No shows found matching your criteria.</p>
                            <Link href="/shows" className="text-sky-blue hover:underline mt-2 inline-block">Clear all filters</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                            {shows.map((show: any) => (
                                <Link
                                    key={show.id}
                                    href={`/show/${show.id}`}
                                    className="group relative block aspect-[2/3] bg-[#1c2229] rounded overflow-hidden border border-[#445566] hover:border-sky-blue transition-colors shadow-lg card-hover"
                                >
                                    {show.poster_path ? (
                                        <Image
                                            src={getImageUrl(show.poster_path)}
                                            alt={show.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-[#99aabb]">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <div className="font-bold text-white text-sm">{show.name}</div>
                                        <div className="text-xs text-sky-blue">{show.first_air_date?.split('-')[0]}</div>
                                        {show.vote_average > 0 && (
                                            <div className="text-[10px] text-yellow-500 mt-1">★ {show.vote_average.toFixed(1)}</div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
