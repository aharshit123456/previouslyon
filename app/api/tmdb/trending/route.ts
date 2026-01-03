
import { NextResponse } from 'next/server';
import { getTrendingShows } from '@/lib/tmdb';

export async function GET() {
    try {
        const data = await getTrendingShows();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }
}
