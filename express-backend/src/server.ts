import 'dotenv/config';
import './db/mongo';

import express from 'express';

import cors from 'cors';
import jwtCheck from './middlewares/jwt-check';
import createUserProfile from './middlewares/createUserProfile';

import SentenceListRoutes from './api/sentenceLists';
import SentenceRoutes from './api/sentences';
import WordRoutes from './api/words';
import CourseRoutes from './api/courses';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(jwtCheck);
app.use(createUserProfile);

app.use('/api/sentenceLists', SentenceListRoutes);
app.use('/api/sentences', SentenceRoutes);
app.use('/api/words', WordRoutes);
app.use('/api/courses', CourseRoutes);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
