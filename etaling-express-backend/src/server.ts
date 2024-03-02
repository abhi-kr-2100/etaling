import express from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import cors from 'cors';
import 'dotenv/config';

const PORT = process.env.PORT ?? 3000;

const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
});

const app = express();

app.use(cors());
app.use(jwtCheck);

app.get('/api', (req, res) => {
  console.log(req);
  res.send('Hello, world!');
});

app.listen(PORT);
