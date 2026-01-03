
import { supabase } from '@/lib/supabase';
import { getImageUrl } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { User } from 'lucide-react';
import type { Metadata } from 'next';

// Force dynamic since we fetch data that might change
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const { data: list } = await supabase
        .from('lists')
        .select('name, description')
        .eq('id', id)
        .single();

    if (!list) return { title: 'List Not Found' };

    return {
        title: list.name,
        description: list.description || `A curated list of TV shows on PreviouslyOn.`,
        openGraph: {
            title: list.name,
            description: list.description || undefined,
        }
    };
}

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch List + Owner Profile
    const { data: list, error } = await supabase
        .from('lists')
        .select(`
        *,
        profiles:user_id (username, avatar_url)
    `)
        .eq('id', id)
        .single();

    if (error || !list) {
        return notFound();
    }

    // Fetch List Items + Show Details
    // Fetch List Items + Show Details
    const { data: items, error: itemsError } = await supabase
        .from('list_items')
        .select(`
        *,
        shows (
            id,
            name,
            poster_path,
            first_air_date,
            vote_average
        )
    `)
        .eq('list_id', id);

    console.log(`[ListDetail] Items fetch result for list ${id}:`, { count: items?.length, error: itemsError });

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: list.name,
        description: list.description,
        author: {
            '@type': 'Person',
            name: list.profiles.username
        },
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: items?.map((item: any, index: number) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.shows?.name,
                image: getImageUrl(item.shows?.poster_path)
            }))
        }
    };

    return (
        <div className="container-custom py-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-4">{list.name}</h1>
                <p className="text-[#99aabb] max-w-2xl mx-auto mb-6">{list.description}</p>

                <Link href={`/user/${list.profiles.username}`} className="inline-flex items-center gap-2 text-sm text-sky-blue hover:text-baby-pink transition-colors">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#2c3440]">
                        {list.profiles.avatar_url ? (
                            <Image src={list.profiles.avatar_url} alt={list.profiles.username} fill className="object-cover" />
                        ) : (
                            <User className="w-4 h-4 absolute top-1 left-1 text-[#99aabb]" />
                        )}
                    </div>
                    Created by <span className="font-bold">{list.profiles.username}</span>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {items?.map((item: { id: number; shows: { id: number; name: string; poster_path: string; first_air_date: string } | null }) => {
                    const show = item.shows;
                    if (!show) return null;

                    return (
                        <Link key={item.id} href={`/show/${show.id}`} className="group relative block aspect-[2/3] bg-[#1c2229] rounded overflow-hidden border border-[#445566] hover:border-primary transition-colors">
                            {show.poster_path ? (
                                <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-gray-500">No Image</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <div className="font-bold text-white text-sm">{show.name}</div>
                                <div className="text-xs text-[#99aabb]">{show.first_air_date?.split('-')[0]}</div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {(!items || items.length === 0) && (
                <div className="text-center py-20 text-[#445566] italic border border-dashed border-[#2c3440] rounded">
                    This list is empty.
                </div>
            )}
        </div>
    );
}
