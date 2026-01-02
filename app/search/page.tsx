
import { searchShows, getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
    const { q } = await searchParams;

    if (!q) {
        return (
            <div className="container-custom py-10 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Search</h1>
                <p className="text-[#99aabb]">Please enter a search term.</p>
            </div>
        );
    }

    const results = await searchShows(q);

    return (
        <div className="container-custom py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Results for <span className="text-sky-blue">"{q}"</span></h1>

            {results.results.length === 0 ? (
                <p className="text-[#99aabb]">No results found.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {results.results.map((show: any) => (
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
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-[#99aabb]">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <div className="font-bold text-white text-sm">{show.name}</div>
                                <div className="text-xs text-sky-blue">{show.first_air_date?.split('-')[0]}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
