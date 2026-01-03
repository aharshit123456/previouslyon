
import { NextResponse } from 'next/server';
import { searchShows } from '@/lib/tmdb';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const data = await searchShows(query);
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
    }
}
