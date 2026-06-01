import axios from 'axios';
import { Movie, MovieInput } from '../@types/letterboxd';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';
const DEFAULT_BANNER = "https://s.ltrbxd.com/static/img/empty-poster-125-AiuBHVCI.png";

export async function buildMoviesPosters(scrapedMovies: MovieInput[]): Promise<Movie[]> {
    return Promise.all(
        scrapedMovies.map(async (movie: MovieInput): Promise<Movie> => {
            const posterUrl = await getMoviePoster(movie.posterLocation);

            return {
                title: movie.title,
                letterboxdUrl: movie.letterboxdUrl,
                posterUrl
            };
        })
    );
}

export async function getMoviePoster(movieUrl: string): Promise<string> {
    try {
        const response = await axios.get(movieUrl, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        return response.data.url2x ? response.data.url2x : response.data.url;
    } catch (error) {
        return DEFAULT_BANNER;
    }
}