
import { getTrendingShows, getImageUrl, getTVGenres } from '@/lib/tmdb';
import Link from 'next/link';
import Image from 'next/image';

// We fetch directly in the server component for the initial render
export default async function Home() {
  let trendingShows = [];
  try {
    const data = await getTrendingShows();
    trendingShows = data.results || [];
  } catch (e) {
    console.error("Failed to fetch trending shows", e);
  }

  let genres = [];
  try {
    const genreData = await getTVGenres();
    genres = genreData.genres || [];
  } catch (e) {
    console.error("Failed to fetch genres", e);
  }

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] w-full bg-gradient-to-t from-[#14181c] to-transparent">
        {trendingShows[0] && (
          <>
            <div className="absolute inset-0 z-0 opacity-40">
              <Image
                src={getImageUrl(trendingShows[0].backdrop_path, 'original')}
                alt="Hero"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#14181c] via-[#14181c]/60 to-transparent" />

            <div className="container-custom relative z-20 h-full flex flex-col justify-end pb-10">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg line-clamp-2">{trendingShows[0].name}</h1>
              <p className="max-w-xl text-gray-200 line-clamp-3 text-sm md:text-lg drop-shadow-md">{trendingShows[0].overview}</p>
              <Link href={`/show/${trendingShows[0].id}`} className="mt-4 px-6 py-2 bg-primary text-white font-bold rounded w-fit hover:bg-primary-hover transition-colors text-sm md:text-base">
                View Show
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Genres Section */}
      <section className="container-custom mt-8">
        <h2 className="text-sm font-bold text-[#99aabb] uppercase tracking-wider mb-4">Browse by Genre</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre: any) => (
            <Link
              key={genre.id}
              href={`/search?q=${encodeURIComponent(genre.name)}`}
              className="px-3 py-1 bg-[#1c2229] border border-[#445566] rounded-full text-xs text-pastel-petal hover:border-sky-blue hover:text-white transition-colors"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <section className="container-custom mt-10">
        <h2 className="text-xl font-normal border-b border-[#445566] pb-2 mb-4 text-[#99aabb] uppercase tracking-wider">
          Trending This Week
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {trendingShows.map((show: any) => (
            <Link key={show.id} href={`/show/${show.id}`} className="group relative block aspect-[2/3] bg-[#2c3440] rounded overflow-hidden card-hover">
              {show.poster_path ? (
                <Image
                  src={getImageUrl(show.poster_path)}
                  alt={show.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center p-2 text-xs text-gray-500">No Image</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                <span className="text-white text-center font-semibold text-sm">{show.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Intro Text */}
      <section className="container-custom mt-16 text-center py-10 bg-[#1c2229] rounded-lg border border-[#445566]">
        <h3 className="text-2xl font-bold text-white mb-4">Track shows, watched episodes, and more.</h3>
        <p className="text-[#99aabb] mb-6">The social network for TV lovers. Rate, review, and track your viewing history.</p>
        <Link href="/signup" className="px-8 py-3 bg-[#445566] text-white font-bold rounded hover:bg-[#556677] transition-colors">
          Get Started - It's Free
        </Link>
      </section>
    </div>
  );
}
