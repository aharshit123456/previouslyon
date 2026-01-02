
import { getSeasonDetails, getShowDetails, getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import SeasonView from '@/components/season-view';

export default async function SeasonPage({ params }: { params: Promise<{ id: string; seasonNumber: string }> }) {
    const { id, seasonNumber } = await params;
    let season = null;
    let show = null;

    try {
        [season, show] = await Promise.all([
            getSeasonDetails(id, parseInt(seasonNumber)),
            getShowDetails(id)
        ]);
    } catch (error) {
        return <div className="p-10 text-center text-red-500">Error loading season details.</div>;
    }

    if (!season) return <div className="p-10 text-center">Season not found</div>;

    return (
        <div className="pb-20">
            <div className="bg-[#1c2229] border-b border-[#445566] py-10">
                <div className="container-custom flex gap-8 items-end">
                    {/* Poster */}
                    <div className="relative w-32 shrink-0 aspect-[2/3] rounded overflow-hidden shadow-xl border border-[#445566]">
                        <Image
                            src={getImageUrl(season.poster_path)}
                            alt={season.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="mb-2">
                        <Link href={`/show/${id}`} className="text-primary hover:underline text-sm font-bold flex items-center gap-1 mb-2">
                            <ChevronLeft className="w-4 h-4" /> Back to Show
                        </Link>
                        <h1 className="text-3xl font-bold text-white">{season.name} <span className="text-gray-500 text-xl font-normal">({season.air_date?.split('-')[0]})</span></h1>
                        <p className="text-[#99aabb] mt-2 max-w-2xl">{season.overview}</p>
                    </div>
                </div>
            </div>

            <div className="container-custom mt-8">
                <h3 className="text-lg font-bold text-white border-b border-[#445566] pb-2 mb-6">
                    Episodes
                    <span className="text-xs text-[#99aabb] font-normal uppercase tracking-wider ml-2">{season.episodes?.length} Total</span>
                </h3>

                <SeasonView
                    show={{
                        id: show.id,
                        name: show.name,
                        poster_path: show.poster_path,
                        first_air_date: show.first_air_date
                    }}
                    seasonNumber={parseInt(seasonNumber)}
                    episodes={season.episodes || []}
                />
            </div>
        </div>
    );
}

