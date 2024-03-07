import 'dotenv/config';

import express from 'express';

import cors from 'cors';
import jwtCheck from './middlewares/jwt-check';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(cors());
app.use(jwtCheck);

app.get('/api', (req, res) => {
  console.log(req);
  res.send('Hello, world!');
});

app.listen(PORT);
