import axios from 'axios';
import * as cheerio from 'cheerio';
import { Request, Response } from 'express';
import { getAllWatchlistMovies } from './scraper';
import { buildMoviesPosters } from '../utils/moviePoster';
import { Movie, MovieInput } from '../@types/letterboxd';

const LETTERBOXD_BASE_URL = 'https://letterboxd.com';
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
        const movies: Movie[] = await getAllWatchlistMovies(username);

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

export async function getWatchlistPage(username: string, page: number): Promise<Movie[]> {
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
    const scrapedMovies: MovieInput[] = [];

    $(".griditem").each((_, element) => {
        const slug = $(element).find('[data-item-slug]').attr('data-item-slug') || '';
        const posterLocation = 'https://letterboxd.com/film/' + slug + '/poster/std/125/';

        if (!slug) return;

        const title = $(element).find('[data-item-full-display-name]').attr('data-item-full-display-name') || 'Title not available';

        scrapedMovies.push({
            title,
            letterboxdUrl: `${LETTERBOXD_BASE_URL}/film/${slug}`,
            posterLocation
        });
    });

    return await buildMoviesPosters(scrapedMovies);
}
