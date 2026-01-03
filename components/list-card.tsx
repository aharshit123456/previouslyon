
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { Lock, Globe, ArrowRight } from 'lucide-react';

interface ListCardProps {
    list: {
        id: string;
        name: string;
        description: string | null;
        is_public: boolean;
        count: number;
        posters: string[];
    }
}

export default function ListCard({ list }: ListCardProps) {
    return (
        <Link href={`/lists/${list.id}`} className="block group h-full">
            <div className="bg-[#1c2229] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all h-full flex flex-col border border-[#2c3440] group-hover:border-primary/50">
                {/* Poster Collage */}
                <div className="aspect-[2/1] bg-[#14181c] relative grid grid-cols-4 gap-px border-b border-[#2c3440]">
                    {list.posters.slice(0, 4).map((poster, i) => (
                        <div key={i} className="relative w-full h-full bg-[#2c3440] overflow-hidden">
                            <Image
                                src={getImageUrl(poster)}
                                alt="Show"
                                fill
                                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    ))}
                    {list.posters.length === 0 && (
                        <div className="col-span-4 flex items-center justify-center text-gray-600 text-xs font-medium">
                            Empty List
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-white text-xl leading-tight group-hover:text-primary transition-colors line-clamp-1">{list.name}</h4>
                        {list.is_public ? <Globe className="w-4 h-4 text-gray-500" /> : <Lock className="w-4 h-4 text-amber-500" />}
                    </div>

                    {list.description && <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow font-medium leading-relaxed">{list.description}</p>}

                    <div className="mt-auto pt-4 border-t border-[#2c3440] flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                        <span>{list.count} {list.count === 1 ? 'Show' : 'Shows'}</span>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
