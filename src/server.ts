import express, { Express } from 'express';
import morgan from 'morgan';
import cors from 'cors';

import router from '#';

export const createServer = (): Express => {
  const app = express();
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');

  app
    .use(cors({ origin: allowedOrigins }))
    .use(morgan('dev'))
    .use(express.json())
    .use(express.urlencoded({ extended: false }));

  app.use(router);

  return app;
};
