import 'dotenv/config';
import './db';

import express from 'express';

import cors from 'cors';
import jwtCheck from './middlewares/jwt-check';
import createUserProfile from './middlewares/createUserProfile';

import SentenceListRoutes from './api/sentenceLists';
import SentenceRoutes from './api/sentence';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(jwtCheck);
app.use(createUserProfile);

app.use('/api/sentenceLists', SentenceListRoutes);
app.use('/api/sentences', SentenceRoutes);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
