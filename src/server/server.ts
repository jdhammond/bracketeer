import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose, { ConnectOptions } from 'mongoose';
import { tournamentRouter } from './routes/tournamentRouter.js';
import { errorObject } from '../types';

dotenv.config();

// Database setup
const mongooseBaseName = 'bracketeer';
const database = {
  development: `mongodb://localhost/${mongooseBaseName}-development`,
  test: `mongodb://localhost/${mongooseBaseName}-test`,
};

// used for cors
const serverDevPort = 8000;
const clientDevPort = 5173;

// pulling in .env
const localDb = process.env.TESTENV ? database.test : database.development;

const currentDb = process.env.MONGODB_URI || localDb;

// @ts-ignore
const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}`,
  })
);
const PORT = process.env.PORT || serverDevPort;

mongoose.connect(currentDb, {
  useNewUrlParser: true,
} as ConnectOptions);

app.use(express.json());

app.use('/tournament', tournamentRouter);

// Any route without a defined endpoint returns 404
app.use('*', (req, res) => {
  return res.status(404).send('Not Found');
});

// Global error handler -- for throwing errors from middleware
app.use(async (err: any, req: Request, res: Response, next: NextFunction) => {
  const defaultErr: errorObject = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: { err: 'An error occurred' },
  };
  const errorObj: errorObject = Object.assign(defaultErr, err);
  console.log(errorObj.log);
  return res.status(errorObj.status).json(errorObj.message);
});

app.listen(PORT, () => {
  console.log(`your server on port:${PORT} is running you better catch it`);
});
