
import { getTrendingShows, getImageUrl, getTVGenres } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import RecommendedShows from '@/components/recommended-shows';
import ActivityFeed from '@/components/activity-feed';
import { createClient } from '@/lib/supabase-server';
import { getRecommendations } from '@/lib/tmdb';

import AIAssistant from '@/components/ai-assistant';
import { Play, ArrowRight } from 'lucide-react';

export const revalidate = 0; // Force dynamic rendering for personalization

// We fetch directly in the server component for the initial render
export default async function Home() {
  console.log("Reticulating Splines... (Home Page Render Start)");

  const supabase = await createClient();

  let trendingShows: { id: number; name: string; overview: string; backdrop_path: string; poster_path: string }[] = [];
  try {
    const data = await getTrendingShows();
    trendingShows = data.results || [];
  } catch (e) {
    console.error("Failed to fetch trending shows", e);
  }

  let genres: { id: number; name: string }[] = [];
  try {
    const genreData = await getTVGenres();
    genres = genreData.genres || [];
  } catch (e) {
    console.error("Failed to fetch genres", e);
  }

  // --- Personalization Algo ---
  let recommendedShows: { id: number; name: string; poster_path: string }[] = [];
  const { data: { session } } = await supabase.auth.getSession();

  let friendActivity: any[] = [];
  if (session?.user) {
    // Fetch Friend Activity
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id);

    if (following && following.length > 0) {
      const followingIds = following.map(f => f.following_id);

      const { data: activity } = await supabase
        .from('user_episode_progress')
        .select(`
          id,
          watched_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          ),
          episodes (
            season_number,
            episode_number,
            shows (
              id,
              name,
              poster_path
            )
          )
        `)
        .in('user_id', followingIds)
        .order('watched_at', { ascending: false })
        .limit(3); // Limit to top 3 for space

      if (activity) friendActivity = activity;
    }
  }

  // Basic Personalization Logic
  if (session?.user) {
    const { data: userListItems } = await supabase
      .from('list_items')
      .select('show_id, lists!inner(user_id)')
      .eq('lists.user_id', session.user.id);

    const userShowIds = userListItems?.map((item: { show_id: number }) => item.show_id) || [];
    console.log("HOME DEBUG: User Show IDs for Recs:", userShowIds.length);

    if (userShowIds.length > 0) {
      // eslint-disable-next-line react-hooks/purity
      const shuffled = userShowIds.sort(() => 0.5 - Math.random());
      const sourceIds = shuffled.slice(0, 3);
      console.log("HOME DEBUG: Source IDs for Recs:", sourceIds);

      try {
        const promises = sourceIds.map((id: number) => getRecommendations(id));
        const results = await Promise.all(promises);
        const allRecs = results.flatMap((r: { results: any[] }) => r.results || []);
        const uniqueRecs = new Map();

        allRecs.forEach((show: { id: number; name: string; poster_path: string }) => {
          if (!userShowIds.includes(show.id)) {
            uniqueRecs.set(show.id, show);
          }
        });

        recommendedShows = Array.from(uniqueRecs.values())
          // eslint-disable-next-line react-hooks/purity
          .sort(() => 0.5 - Math.random())
          .slice(0, 5); // Take 5 for horizontal row
        console.log("HOME DEBUG: Final Recs Count:", recommendedShows.length);
      } catch (e) {
        console.error("Personalization Error:", e);
      }
    }
  }

  return (
    <div className="pb-20 pt-10">

      {/* Hero Section */}
      <div className="container-custom grid lg:grid-cols-2 gap-12 items-center mb-20 md:mb-32">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-white">
            Track <br /> Your <span className="text-primary">TV</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-md leading-relaxed">
            The social platform for TV lovers. See what friends are watching, track your progress, and discover your next obsession.
          </p>
          <div className="flex gap-4">
            <Link href="/signup" className="px-8 py-4 bg-white text-black font-bold uppercase tracking-wider rounded-full hover:bg-gray-200 transition-colors shadow-lg flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/shows" className="px-8 py-4 bg-[#1c2229] text-white font-bold uppercase tracking-wider rounded-full border border-[#2c3440] hover:border-white transition-colors flex items-center gap-2">
              Browse Shows
            </Link>
          </div>
        </div>

        {/* Featured Card */}
        {trendingShows[0] && (
          <div className="relative aspect-video md:aspect-[4/3] bg-[#1c2229] rounded-3xl p-4 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 group border border-[#2c3440]">
            <div className="absolute inset-0 bg-white/5 rounded-3xl transform translate-x-4 translate-y-4 -z-10" />
            <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0e1114]">
              <Image
                src={getImageUrl(trendingShows[0].backdrop_path, 'original')}
                alt={trendingShows[0].name}
                fill
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-0 left-0 p-8">
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">Trending Now</span>
                <h2 className="text-4xl font-black text-white mb-2 leading-none">{trendingShows[0].name}</h2>
                <p className="text-gray-300 line-clamp-2 max-w-sm mb-6 font-medium text-sm">{trendingShows[0].overview}</p>
                <Link href={`/show/${trendingShows[0].id}`} className="inline-flex items-center gap-2 text-white font-bold uppercase text-sm border-b-2 border-primary hover:text-primary transition-colors">
                  View Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Assistant Section */}
      <section className="container-custom relative z-30 mb-20">
        <AIAssistant />
      </section>

      {/* Genres Chips */}
      <section className="container-custom mb-20">
        <div className="flex flex-wrap gap-3 justify-center">
          {genres.slice(0, 10).map((genre) => (
            <Link
              key={genre.id}
              href={`/search?q=${encodeURIComponent(genre.name)}`}
              className="px-6 py-2 bg-[#1c2229] border border-[#2c3440] rounded-full text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-white hover:text-black hover:border-white transition-colors shadow-sm"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Left Column: Trending (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-4 text-white">
            Trending <span className="h-1 flex-1 bg-[#2c3440]"></span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {trendingShows.slice(1, 7).map((show) => (
              <Link key={show.id} href={`/show/${show.id}`} className="group bg-[#1c2229] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-[#2c3440] hover:border-gray-500">
                <div className="aspect-[2/3] relative bg-[#0e1114] overflow-hidden">
                  {show.poster_path ? (
                    <Image
                      src={getImageUrl(show.poster_path)}
                      alt={show.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white leading-tight group-hover:text-primary transition-colors truncate">{show.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-medium text-gray-500">TV Show</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Activity & Recs (4 cols) */}
        <div className="lg:col-span-4 space-y-12">

          {/* Friend Activity */}
          {friendActivity.length > 0 && (
            <div className="bg-[#1c2229] p-6 rounded-2xl border border-[#2c3440] shadow-sm">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 pb-2 border-b border-[#2c3440]">Friend Activity</h3>
              <ActivityFeed activities={friendActivity} />
            </div>
          )}

          {/* Recommended (If personalized) */}
          {recommendedShows.length > 0 && (
            <div className="bg-black text-white p-6 rounded-2xl shadow-xl border border-[#2c3440]">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 pb-2 border-b border-gray-800">For You</h3>
              <div className="space-y-4">
                {recommendedShows.map((show) => (
                  <Link key={show.id} href={`/show/${show.id}`} className="flex gap-4 group">
                    <div className="w-12 aspect-[2/3] relative rounded bg-gray-800 shrink-0 overflow-hidden">
                      <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{show.name}</h4>
                      <span className="text-xs text-gray-500">Recommended</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Promo Box */}
          <div className="bg-[#fbbf24] p-8 rounded-2xl shadow-lg text-center">
            <h3 className="text-2xl font-black uppercase mb-4 text-black">Join the list</h3>
            <p className="text-black/80 font-medium mb-6 leading-relaxed">
              Create lists, track episodes, and share with friends.
            </p>
            <Link href="/signup" className="inline-block px-8 py-3 bg-black text-white font-bold uppercase tracking-wider rounded-full hover:scale-105 transition-transform">
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
