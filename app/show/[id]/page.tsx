
import { getShowDetails, getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import ShowActions from '@/components/show-actions';
import Image from 'next/image';
import { Star, Clock, Calendar, Play, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    try {
        const show = await getShowDetails(id);
        const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : '';
        return {
            title: `${show.name} (${year})`,
            description: show.overview,
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
    try {
        show = await getShowDetails(id);
    } catch (error) {
        return <div className="p-10 text-center text-red-500">Error loading show details.</div>;
    }

    if (!show) return <div className="p-10 text-center">Show not found</div>;

    const year = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown';

    return (
        <div className="min-h-screen font-sans text-white bg-[#14181c] relative overflow-hidden">
            {/* Grid Background */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-[0.2]"
                style={{
                    backgroundImage: `linear-gradient(to right, #2c3440 1px, transparent 1px), linear-gradient(to bottom, #2c3440 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 w-full max-w-[1600px] mx-auto p-6 md:p-12">



                {/* Hero / Title Section */}
                <div className="mb-20 text-center">
                    <div className="inline-flex items-center gap-2 bg-[#1c2229] border border-[#2c3440] rounded-full px-4 py-1 mb-6 shadow-sm">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">New Season</span>
                        <span className="text-xs font-medium text-gray-400">Check out the latest episodes</span>
                        <span className="bg-white/10 rounded-full p-1"><Play className="w-3 h-3 text-white" /></span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.9] mb-8 uppercase text-white">
                        {show.name}
                    </h1>

                    <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-400 leading-relaxed font-medium mb-10">
                        {show.tagline || `${show.name} is a top-rated TV show released in ${year}.`}
                    </p>

                    <div className="flex justify-center gap-4">
                        <ShowActions show={{
                            id: show.id,
                            name: show.name,
                            poster_path: show.poster_path,
                            first_air_date: show.first_air_date
                        }} />
                        <button className="px-8 py-4 font-bold text-sm tracking-wider uppercase bg-[#ff4f00] text-white rounded-full hover:bg-[#e64700] transition-colors shadow-lg border border-transparent">
                            Start Watching
                        </button>
                    </div>
                </div>


                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">

                    {/* Card 1: Overview (Dark) */}
                    <div className="lg:col-span-7 bg-[#1c2229] rounded-3xl p-10 md:p-14 shadow-2xl flex flex-col justify-center relative overflow-hidden group border border-[#2c3440]">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Star className="w-32 h-32 text-white" />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-white">
                            The Story So Far
                        </h2>
                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed font-medium">
                            {show.overview}
                        </p>

                        <div className="mt-10 flex gap-4 flex-wrap">
                            {show.genres?.map((g: any) => (
                                <span key={g.id} className="text-xs font-bold uppercase tracking-wider border-2 border-[#445566] text-gray-300 px-4 py-2 rounded-full hover:bg-white hover:text-black hover:border-white transition-colors cursor-default">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Card 2: Stats (Double Dark / Contrast) */}
                    <div className="lg:col-span-5 bg-black text-white rounded-3xl p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col border border-[#2c3440]">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-2xl font-bold">Details</h3>
                            <div className="flex gap-2 text-[#fbbf24]">
                                <span className="text-xs font-mono">ID: {show.id}</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-10 font-mono text-sm">
                            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                                <span className="text-gray-500">RATING</span>
                                <div className="flex items-center gap-2 text-[#fbbf24]">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="text-2xl">{show.vote_average.toFixed(1)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                                <span className="text-gray-500">RELEASED</span>
                                <span className="text-xl">{year}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                                <span className="text-gray-500">SEASONS</span>
                                <span className="text-xl text-primary">{show.number_of_seasons}</span>
                            </div>

                            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                                <span className="text-gray-500">STATUS</span>
                                <span className="text-xl">{show.status}</span>
                            </div>
                        </div>

                        <div className="mt-12 space-y-3">
                            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                <span>POPULARITY</span>
                                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[80%]" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                <span>VOTE COUNT</span>
                                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#fbbf24] w-[60%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Seasons List */}
                <div className="mb-20">
                    <h3 className="text-3xl font-black uppercase mb-10 text-center text-white">Seasons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {show.seasons?.filter((s: any) => s.season_number > 0).map((season: any) => (
                            <Link key={season.id} href={`/show/${show.id}/season/${season.season_number}`} className="group relative bg-[#1c2229] border border-[#2c3440] rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:border-gray-500">
                                <div className="aspect-video relative overflow-hidden bg-[#0e1114]">
                                    {season.poster_path ? (
                                        <Image src={getImageUrl(season.poster_path)} alt={season.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-600">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white font-bold uppercase tracking-widest border border-white px-4 py-2 rounded-full text-sm">View Season</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors text-white">{season.name}</h4>
                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span>{season.episode_count} Episodes</span>
                                        <span>{season.air_date ? new Date(season.air_date).getFullYear() : 'TBA'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
