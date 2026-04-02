import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import router from './router';

const app = express();

app.use(cors({
    methods: ['GET'],
    origin: [process.env.ORIGIN_URL],
    credentials: true,
}));
app.use(router);

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
    console.log(`[API] Running on http://localhost:${PORT}`);
});