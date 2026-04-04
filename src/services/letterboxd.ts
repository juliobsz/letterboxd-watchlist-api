import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedMovie } from '../@types/letterboxd';
import { delay } from '../utils/delay';
import { extractYear } from '../utils/movieText';
import { buildEnrichedWatchlist } from './enrichment';
import { Request, Response } from 'express';

const LETTERBOXD_BASE_URL = 'https://letterboxd.com';
const LETTERBOXD_PAGE_DELAY_MS = 1500;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

class LetterboxdUserNotFoundError extends Error {
    constructor(username: string) {
        super(`Letterboxd user not found: ${username}`);
        this.name = 'LetterboxdUserNotFoundError';
    }
}

export async function getWatchlistRoute(req: Request, res: Response) {
    const username = String(req.params.username || "").trim();

    if (!username) return res.status(400).json({ error: 'username is required' });

    try {
        const movies = await buildEnrichedWatchlist(username);

        return res.json({
            username,
            count: movies.length,
            watchlistUrl: `${LETTERBOXD_BASE_URL}/${username}/watchlist/`,
            movies
        });
    } catch (error) {
        if (error instanceof LetterboxdUserNotFoundError) return res.status(404).json({ error: 'user not found' });
        return res.status(500).json({ error: 'failed to fetch watchlist' });
    }
}

async function getWatchlistPage(username: string, page: number): Promise<ScrapedMovie[]> {
    const url = `${LETTERBOXD_BASE_URL}/${username}/watchlist/page/${page}/`;

    let data: string;
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        data = response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) throw new LetterboxdUserNotFoundError(username);
        throw error;
    }

    const $ = cheerio.load(data);
    const movies: ScrapedMovie[] = [];

    $(".griditem").each((_, element) => {
        const target =
            $(element).find("[data-target-link]").attr('data-target-link') ||
            $(element).find("div[data-target-link]").attr('data-target-link') ||
            '';

        if (!target.startsWith('/film/')) return;

        const slug = target.replace('/film/', '').replace(/\/$/, '');
        const imageAlt = $(element).find('img').attr('alt')?.trim() || '';
        const rawTitle =
            imageAlt ||
            $(element).attr('data-film-name') ||
            $(element).find('[data-film-name]').attr('data-film-name') ||
            slug.replace(/-/g, ' ');

        const yearText =
            $(element).text() ||
            $(element).attr('data-film-release-year') ||
            '';

        const profile = $(".profile-mini-person");
        const avatar = profile.find('img').attr('src') || '';
        const displayName = String(profile.find('h1 a').prop('innerHTML') || '');

        movies.push({
            title: rawTitle,
            year: extractYear(yearText),
            slug,
            letterboxdUrl: `${LETTERBOXD_BASE_URL}${target}`,
            avatar,
            displayName
        });
    });

    return movies;
}

export async function getAllWatchlistMovies(username: string): Promise<ScrapedMovie[]> {
    const allMovies: ScrapedMovie[] = [];
    let page = 1;

    while (true) {
        const currentPageMovies = await getWatchlistPage(username, page);
        if (!currentPageMovies.length) break;

        allMovies.push(...currentPageMovies);
        page += 1;

        await delay(LETTERBOXD_PAGE_DELAY_MS);
    }

    const dedupedBySlug = new Map<string, ScrapedMovie>();

    for (const movie of allMovies) {
        dedupedBySlug.set(movie.slug, movie);
    }

    return [...dedupedBySlug.values()];
}
