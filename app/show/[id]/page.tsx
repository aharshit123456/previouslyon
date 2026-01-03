
import { getShowDetails, getImageUrl, getShowVideos } from '@/lib/tmdb';
import Link from 'next/link';
import ShowActions from '@/components/show-actions';
import VideoBackground from '@/components/video-background';
import Image from 'next/image';
import { Calendar, Star, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const show = await getShowDetails(id);
        const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : '';
        return {
            title: `${show.name} (${year})`,
            description: show.overview,
            openGraph: {
                title: `${show.name} (${year})`,
                description: show.overview,
                images: [
                    {
                        url: getImageUrl(show.backdrop_path, 'original'),
                        width: 1200,
                        height: 630,
                        alt: show.name,
                    },
                ],
            },
        };
    } catch {
        return {
            title: 'Show Not Found',
        };
    }
}

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let show = null;
    let videos = [];
    try {
        const [showData, videosData] = await Promise.all([
            getShowDetails(id),
            getShowVideos(id)
        ]);
        show = showData;
        videos = videosData.results || [];
    } catch (error) {
        return <div className="p-10 text-center text-red-500">Error loading show details.</div>;
    }

    if (!show) return <div className="p-10 text-center">Show not found</div>;

    // JSON-LD for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: show.name,
        description: show.overview,
        image: getImageUrl(show.poster_path),
        aggregateRating: show.vote_average > 0 ? {
            '@type': 'AggregateRating',
            ratingValue: show.vote_average,
            bestRating: 10,
            worstRating: 1,
            ratingCount: show.vote_count
        } : undefined,
        startDate: show.first_air_date,
        numberOfSeasons: show.number_of_seasons,
        numberOfEpisodes: show.number_of_episodes,
    };

    const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown';

    return (
        <div className="pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Backdrop Header */}
            <div className="relative h-[50vh] w-full overflow-hidden bg-black">
                <VideoBackground
                    videos={videos}
                    fallbackImage={getImageUrl(show.backdrop_path, 'original')}
                    fallbackAlt={show.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-transparent z-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#14181c]/50 to-transparent z-20" />

                <div className="container-custom relative h-full flex flex-col justify-end pb-8 z-30">
                    <div className="flex gap-8 items-end">
                        {/* Poster */}
                        <div className="relative w-40 shrink-0 aspect-[2/3] rounded overflow-hidden shadow-2xl border border-[#445566] hidden md:block">
                            <Image
                                src={getImageUrl(show.poster_path)}
                                alt={show.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Text Info */}
                        <div className="mb-2">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{show.name} <span className="text-2xl text-gray-400 font-normal">({year})</span></h1>
                            <div className="flex items-center gap-4 text-sm text-[#99aabb] mb-4">
                                {show.vote_average > 0 && (
                                    <span className="flex items-center gap-1 text-white">
                                        <Star className="w-4 h-4 text-primary fill-primary" />
                                        {show.vote_average.toFixed(1)}
                                    </span>
                                )}
                                {show.episode_run_time?.[0] && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> {show.episode_run_time[0]}m
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-[#2c3440] text-white text-xs font-bold px-2 py-1 rounded border border-[#445566]">TV SHOW</span>
                                <span className="text-[#99aabb] font-bold">{show.first_air_date?.split('-')[0]}</span>
                                <span className="text-[#99aabb]">•</span>
                                <span className="text-[#99aabb]">{show.number_of_seasons} Seasons</span>
                            </div>

                            <p className="text-lg text-gray-300 leading-relaxed mb-6">{show.overview}</p>

                            <div className="flex gap-2 flex-wrap mb-8">
                                {show.genres?.map((g: any) => (
                                    <span key={g.id} className="text-xs font-bold text-[#99aabb] uppercase tracking-wider border border-[#445566] px-3 py-1 rounded-full">{g.name}</span>
                                ))}
                            </div>

                            <ShowActions show={{
                                id: show.id,
                                name: show.name,
                                poster_path: show.poster_path,
                                first_air_date: show.first_air_date
                            }} />

                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom mt-8 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-10">
                {/* Sidebar (Mobile Poster + Stats) */}
                <div className="block">
                    <div className="bg-[#1c2229] p-4 rounded border border-[#445566]">
                        <div className="text-xs font-bold text-[#99aabb] uppercase tracking-wider mb-3">Rate</div>
                        <div className="flex justify-between text-2xl text-[#445566]">
                            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                        </div>
                        <div className="my-4 border-t border-[#445566]" />
                        <div className="space-y-2 text-sm text-[#99aabb]">
                            <div className="flex justify-between">
                                <span>Episodes</span>
                                <span className="text-white">{show.number_of_episodes}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className="text-white">{show.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <h3 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-2">Overview</h3>
                    <p className="text-gray-300 leading-relaxed max-w-2xl mb-10">{show.overview}</p>

                    <h3 className="text-lg font-bold text-white border-b border-[#445566] pb-2 mb-6 flex items-center justify-between">
                        Seasons
                        <span className="text-xs text-[#99aabb] font-normal uppercase tracking-wider">{show.number_of_seasons} Total</span>
                    </h3>

                    <div className="space-y-4">
                        {show.seasons?.filter((s: any) => s.season_number > 0).map((season: any) => (
                            <Link key={season.id} href={`/show/${show.id}/season/${season.season_number}`} className="flex gap-4 p-4 bg-[#1c2229] rounded border border-[#445566] hover:border-primary transition-colors group">
                                <div className="relative w-16 aspect-[2/3] shrink-0 bg-[#2c3440] rounded overflow-hidden">
                                    {season.poster_path ? (
                                        <Image src={getImageUrl(season.poster_path)} alt={season.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-xs text-gray-500">No Img</div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{season.name}</h4>
                                    <p className="text-sm text-[#99aabb]">{season.episode_count} Episodes • {season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}</p>
                                </div>
                                <div className="ml-auto flex items-center pr-4">
                                    <span className="text-xs font-bold text-[#445566] group-hover:text-[#99aabb]">VIEW SEASON →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
