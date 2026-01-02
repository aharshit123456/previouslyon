
import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';

// Force dynamic
export const dynamic = 'force-dynamic';

export default async function ListsIndexPage() {

    // Fetch Public Lists
    const { data: lists, error } = await supabase
        .from('lists')
        .select(`
        id,
        name,
        description,
        is_public,
        created_at,
        profiles:user_id (username),
        list_items (
           shows ( poster_path )
        )
    `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

    console.log("Lists Fetch Result:", { count: lists?.length, error });

    if (error) {
        console.error("Supabase Error (Lists):", error);
    }

    return (
        <div className="container-custom py-10">
            <div className="flex justify-between items-center mb-10 border-b border-[#445566] pb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Popular Lists</h1>
                <Link href="/lists/new" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors text-sm md:text-base">
                    <Plus className="w-4 h-4" /> Create List
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists?.map((list: any) => {
                    // Get first 3 posters
                    const posters = list.list_items?.slice(0, 3).map((item: any) => item.shows?.poster_path).filter(Boolean) || [];

                    return (
                        <Link key={list.id} href={`/lists/${list.id}`} className="group bg-[#1c2229] border border-[#445566] rounded hover:border-[#556677] overflow-hidden flex flex-col h-full transition-colors">
                            {/* Preview Collage */}
                            <div className="h-32 bg-[#2c3440] flex items-center justify-center border-b border-[#445566] relative overflow-hidden">
                                {posters.map((path: string, i: number) => (
                                    <div key={i} className="absolute h-full aspect-[2/3] transform transition-transform" style={{
                                        left: `calc(50% - 40px + ${i * 30}px)`,
                                        top: '10px',
                                        zIndex: i,
                                        transform: `rotate(${(i - 1) * 10}deg)`
                                    }}>
                                        <Image src={getImageUrl(path)} alt="" fill className="object-cover rounded shadow-lg" />
                                    </div>
                                ))}
                                {posters.length === 0 && <div className="text-[#99aabb] text-xs">No items</div>}
                            </div>

                            <div className="p-4 flex-grow">
                                <h3 className="font-bold text-white group-hover:text-primary transition-colors text-lg mb-1 line-clamp-1">{list.name}</h3>
                                <p className="text-[#445566] text-xs uppercase tracking-wider mb-2">by {list.profiles.username}</p>
                                <p className="text-[#99aabb] text-sm line-clamp-2 mb-4">{list.description}</p>

                                <div className="text-xs text-[#99aabb] mt-auto">
                                    {list.list_items?.length || 0} shows
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
