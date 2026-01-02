
import { getTrendingShows, getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';

export default async function ShowsPage() {
    const trending = await getTrendingShows();

    return (
        <div className="container-custom py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Popular Shows</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {trending.results.map((show: any) => (
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
        </div>
    );
}
