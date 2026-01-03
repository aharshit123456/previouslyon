import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { Lock, Globe } from 'lucide-react';

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
            <div className="bg-[#1c2229] border border-[#445566] rounded-xl overflow-hidden hover:border-sky-blue transition-colors h-full flex flex-col">
                {/* Poster Collage */}
                <div className="aspect-video bg-[#0e1114] relative p-1 grid grid-cols-4 gap-0.5">
                    {/* We take up to 4 posters. If fewer, we fill with placeholders or adjust logic. 
                        Let's try a overlapping stack or a simple grid. Grid is cleaner for "flaunting".
                    */}
                    {list.posters.slice(0, 4).map((poster, i) => (
                        <div key={i} className="relative w-full h-full bg-[#2c3440] overflow-hidden first:rounded-l last:rounded-r">
                            <Image
                                src={getImageUrl(poster)}
                                alt="Show"
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    ))}
                    {/* If empty */}
                    {list.posters.length === 0 && (
                        <div className="col-span-4 flex items-center justify-center text-[#445566] text-xs">
                            Empty List
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{list.name}</h4>
                        {list.is_public ? <Globe className="w-3 h-3 text-[#667788]" /> : <Lock className="w-3 h-3 text-red-300" />}
                    </div>

                    {list.description && <p className="text-sm text-[#99aabb] line-clamp-2 mb-3 flex-grow">{list.description}</p>}

                    <div className="pt-3 border-t border-[#2c3440] text-xs text-[#667788] uppercase tracking-wider font-semibold">
                        {list.count} {list.count === 1 ? 'Show' : 'Shows'}
                    </div>
                </div>
            </div>
        </Link>
    );
}
