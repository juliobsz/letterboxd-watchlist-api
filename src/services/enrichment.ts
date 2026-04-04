import { EnrichedMovie } from '../@types/letterboxd';
import { getPosterByMovieName } from './tmdb';
import { getAllWatchlistMovies } from './letterboxd';

export async function buildEnrichedWatchlist(username: string): Promise<EnrichedMovie[]> {
    const watchlistMovies = await getAllWatchlistMovies(username);
    const enrichedMovies: EnrichedMovie[] = new Array(watchlistMovies.length);
    let nextIndex = 0;

    const worker = async () => {
        while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            if (currentIndex >= watchlistMovies.length) return;

            const movie = watchlistMovies[currentIndex];
            try {
                const tmdb = await getPosterByMovieName(movie.title, movie.year);

                enrichedMovies[currentIndex] = {
                    title: movie.title,
                    year: movie.year,
                    slug: movie.slug,
                    letterboxdUrl: movie.letterboxdUrl,
                    tmdbId: tmdb.tmdbId,
                    tmdbTitle: tmdb.tmdbTitle,
                    releaseDate: tmdb.releaseDate,
                    imageUrl: tmdb.imageUrl
                };
            } catch (error) {
                console.warn(`[TMDB] Failed to enrich '${movie.title}' (${movie.year || 'unknown year'})`, error);
                enrichedMovies[currentIndex] = {
                    title: movie.title,
                    year: movie.year,
                    slug: movie.slug,
                    letterboxdUrl: movie.letterboxdUrl,
                    tmdbId: null,
                    tmdbTitle: null,
                    releaseDate: null,
                    imageUrl: null
                };
            }
        }
    };

    const workerCount = Math.min(Number(process.env.TMDB_LOOKUP_CONCURRENCY)??4, watchlistMovies.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return enrichedMovies;
}

