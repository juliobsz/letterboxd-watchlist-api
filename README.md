<div align="center">
    <img src="./src/assets/twinboxd-no-bg.png" alt="logo" style="height: 100px;"/>
    <h1 style="font-size: 28px; margin: 10px 0;">Letterboxd Watchlist Scraper</h1>
</div>
<p align="center">Since Letterboxd's official API is not available for public use, this project scrapes Letterboxd to get the watchlist data.</p>
<p align="center">Built with Express.js, TypeScript, Axios and Cheerio.</p>

<details>
    <summary><b>Old vs. New API</b></summary>

> Comparing response times between the **old API** and the **new API** implementation.
    
Since I didn't knew where Letterboxd's poster endpoint was, I had to enrich the data with TMDB's. This meant that for each movie in the watchlist, I had to make an additional request to TMDB to get the poster URL. This was a bottleneck, especially for large watchlists.

The new API implementation uses a more efficient way to get the poster URLs, which significantly reduced the response times.

| Endpoint                  | Old API (avg ms) | New API (avg ms) | Difference | Improvement |
|---------------------------|------------------|------------------|------------|-------------|
| `/juliobsz` (~130 movies) | `8300ms`         | `822ms`          | `7478ms`   | `+90,09%`   |
| `/hirai` (~1000 movies)   | `58084ms`        | `2939ms`         | `55145ms`  | `+94.94%`   |
    
All tests on Postman. Both with 6 concurrency workers. 20 Iterations.

This is a best-case performance comparison, since the response times can vary based on many factors (network conditions, server load, etc.). But it gives a good idea of the performance improvement achieved with the new API implementation.
</details>

## Twinboxd
This API was built for [Twinboxd](https://twinboxd.me) ([Source](https://github.com/juliobsz/twinboxd)), a web app that compares Letterboxd watchlists to find matching movies. Check it out!

## Requirements

- Node.js 20+

## Environment Variables

Rename `.env.example` to `.env`
```env
PORT=3000
ORIGIN_URL=Your Origin URL
MAX_RESULTS=Max number of movies to return (default: 1000)
LETTERBOXD_PAGE_DELAY_MS=Delay between each page in milliseconds (default: 800)
LETTERBOXD_PAGE_CONCURRENCY=Number of concurrent page requests (default: 6)
```

## Host it yourself

```
npm install

npm run dev
```

## API Endpoints

`GET /api/watchlist/:username`

Response shape:

- `username`: Letterboxd username
- `count`: number of movies returned
- `watchlistUrl`: Letterboxd watchlist URL
- `movies`: array of movies

Movie shape:

- `title`: movie title and year
- `letterboxdUrl`: URL to the movie on Letterboxd
- `posterUrl`: URL to the movie poster from Letterboxd (NOT from tmdb)
## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).