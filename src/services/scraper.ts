import { Movie } from '../@types/letterboxd';
import { getWatchlistPage } from './letterboxd';
import { delay } from '../utils/delay';

const LETTERBOXD_PAGE_DELAY_MS = process.env.LETTERBOXD_PAGE_DELAY_MS ? Number(process.env.LETTERBOXD_PAGE_DELAY_MS) : 1500;
const MAX_RESULTS = process.env.MAX_RESULTS ? Number(process.env.MAX_RESULTS) : 800;
const PAGE_CONCURRENCY = process.env.LETTERBOXD_PAGE_CONCURRENCY ? Number(process.env.LETTERBOXD_PAGE_CONCURRENCY) : 6;

export async function getAllWatchlistMovies(username: string): Promise<Movie[]> {
    if (MAX_RESULTS <= 0) throw new Error('MAX_RESULTS must be greater than 0.');
    if (!Number.isFinite(PAGE_CONCURRENCY) || PAGE_CONCURRENCY <= 0) throw new Error('LETTERBOXD_PAGE_CONCURRENCY must be greater than 0.');

    const pageResults: Array<{ page: number; movies: Movie[] }> = [];

    const firstPageMovies: Movie[] = await getWatchlistPage(username, 1);
    if (!firstPageMovies.length) return [];
    pageResults.push({ page: 1, movies: firstPageMovies });

    let collectedCount = firstPageMovies.length;
    if (collectedCount >= MAX_RESULTS) return firstPageMovies.slice(0, MAX_RESULTS);

    const pageSize = firstPageMovies.length;
    const maxPage = Math.max(1, Math.ceil(MAX_RESULTS / pageSize));

    let page = 2;
    let stop = false;

    const getNextPage = () => {
        if (stop) return null;
        if (collectedCount >= MAX_RESULTS) {
            stop = true;
            return null;
        }
        if (page > maxPage) return null;
        const next = page;
        page += 1;
        return next;
    };

    const worker = async () => {
        while (true) {
            const currentPage = getNextPage();
            if (!currentPage) return;

            const currentPageMovies: Movie[] = await getWatchlistPage(username, currentPage);
            if (!currentPageMovies.length) {
                stop = true;
                return;
            }

            pageResults.push({ page: currentPage, movies: currentPageMovies });
            collectedCount += currentPageMovies.length;

            if (collectedCount >= MAX_RESULTS) {
                stop = true;
                return;
            }

            if (LETTERBOXD_PAGE_DELAY_MS) await delay(LETTERBOXD_PAGE_DELAY_MS);
        }
    };

    const workerCount = Math.min(PAGE_CONCURRENCY, Math.max(0, maxPage - 1));
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    pageResults.sort((a, b) => a.page - b.page);
    const allMovies = pageResults.flatMap((result) => result.movies);

    if (MAX_RESULTS === null) return allMovies;
    return allMovies.slice(0, MAX_RESULTS);
}