<div align="center">
    <img src="./src/assets/twinboxd-no-bg.png" alt="logo" style="height: 100px;"/>
    <h1 style="font-size: 28px; margin: 10px 0;">Letterboxd Watchlist Scraper</h1>
</div>
<p align="center">Since Letterboxd's official API is not available for public use, this project scrapes Letterboxd to get watchlist data and enriches it with TMDB.</p>
<p align="center">Built with Express.js, TypeScript, Axios and Cheerio.</p>

## Twinboxd
This API was built for [Twinboxd](https://twinboxd.me) ([Github Repo](https://github.com/juliobsz/twinboxd)), a web app that compares Letterboxd watchlists to find matching movies. Check it out!

## Requirements

- Node.js 18+
- TMDB Api Token

[Access this](https://developer.themoviedb.org/docs/getting-started) to get your token.

## Environment Variables

Rename `.env.example` to `.env`
```env
TMDB_TOKEN=your_tmdb_v4_token
ORIGIN_URL=your_website_url
PORT=3000
TMDB_LOOKUP_CONCURRENCY=4
MAX_RESULTS=800
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

## License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.en.html).