import 'dotenv/config';
import './db';

import express from 'express';

import cors from 'cors';
import jwtCheck from './middlewares/jwt-check';
import createUserProfile from './middlewares/createUserProfile';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(jwtCheck);
app.use(createUserProfile);

app.get('/api', (req, res) => {
  console.log(req);
  res.send('Hello, world!');
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
