import axios from 'axios';
import { TmdbMovieResult, TmdbLookup, CachedLookup } from '../@types/tmdb';
import { getReleaseYear, normalizeText } from '../utils/movieText';

const TMDB_LOOKUP_CACHE_TTL_MS = 1000 * 60 * 30;
const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w600_and_h900_face';
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';

const lookupCache = new Map<string, CachedLookup>();
const inFlightLookups = new Map<string, Promise<TmdbLookup>>();

function createEmptyLookup(): TmdbLookup {
    return {
        tmdbId: null,
        tmdbTitle: null,
        releaseDate: null,
        imageUrl: null
    };
}

function getLookupCacheKey(movieName: string, year?: number): string {
    return `${normalizeText(movieName)}|${year ?? ''}`;
}

function scoreMovieMatch(movie: TmdbMovieResult, inputTitle: string, inputYear?: number): number {
    const normalizedInput = normalizeText(inputTitle);
    const normalizedTitle = normalizeText(movie.title || '');
    const normalizedOriginalTitle = normalizeText(movie.original_title || '');
    const releaseYear = getReleaseYear(movie.release_date);

    let score = 0;

    if (normalizedTitle === normalizedInput) score += 100;
    if (normalizedOriginalTitle === normalizedInput) score += 90;

    if (normalizedTitle.includes(normalizedInput)) score += 40;
    if (normalizedInput.includes(normalizedTitle)) score += 30;

    if (normalizedOriginalTitle.includes(normalizedInput)) score += 35;
    if (normalizedInput.includes(normalizedOriginalTitle)) score += 25;

    if (inputYear && releaseYear) {
        if (releaseYear === inputYear) score += 80;
        else if (Math.abs(releaseYear - inputYear) === 1) score += 20;
    }

    if (movie.poster_path) score += 10;

    return score;
}

export async function getPosterByMovieName(movieName: string, year?: number): Promise<TmdbLookup> {
    const query = movieName.trim();
    if (!query) return createEmptyLookup();

    const cacheKey = getLookupCacheKey(query, year);
    const cached = lookupCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) lookupCache.delete(cacheKey);

    const inFlight = inFlightLookups.get(cacheKey);
    if (inFlight) return inFlight;

    const lookupPromise = (async () => {
        if (!process.env.TMDB_TOKEN) throw new Error('TMDB_TOKEN is not defined.');

        const url = new URL(TMDB_SEARCH_URL);
        url.searchParams.set('query', query);
        url.searchParams.set('include_adult', 'true');
        if (year) url.searchParams.set('year', String(year));

        let results: TmdbMovieResult[] = [];

        try {
            const response = await axios.get<{ results?: TmdbMovieResult[] }>(url.toString(), {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            results = response.data.results ?? [];
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) throw new Error(`[TMDB] Search failed with status ${error.response.status}`);
            throw error;
        }

        if (!results.length) return createEmptyLookup();

        const bestMatch = [...results].sort((a, b) => {
            const scoreA = scoreMovieMatch(a, query, year);
            const scoreB = scoreMovieMatch(b, query, year);
            return scoreB - scoreA;
        })[0];

        const value = {
            tmdbId: bestMatch.id,
            tmdbTitle: bestMatch.title ?? null,
            releaseDate: bestMatch.release_date ?? null,
            imageUrl: bestMatch.poster_path ? `${TMDB_POSTER_BASE_URL}${bestMatch.poster_path}` : null
        };

        lookupCache.set(cacheKey, {
            value,
            expiresAt: Date.now() + TMDB_LOOKUP_CACHE_TTL_MS
        });

        return value;
    })();

    inFlightLookups.set(cacheKey, lookupPromise);

    try {
        return await lookupPromise;
    } finally {
        inFlightLookups.delete(cacheKey);
    }
}

