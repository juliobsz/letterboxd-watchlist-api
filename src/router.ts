import { Router } from 'express';
import { getWatchlistRoute } from './services/letterboxd';

export const routes = Router();

routes.get('/api/watchlist/:username', getWatchlistRoute);

export default routes;