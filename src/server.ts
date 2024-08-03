import swaggerUi from 'swagger-ui-express';
import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';

import router from '#';

export const createServer = (): Express => {
  const app = express();
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',');

  app
    .use(cors({ origin: allowedOrigins }))
    .use(
      morgan('dev', {
        skip: (req) => req.originalUrl.startsWith('/docs'),
      }),
    )
    .use(express.json())
    .use(express.urlencoded({ extended: false }));

  app.use('/docs', swaggerUi.serve, async (req: Request, res: Response) => {
    return res.send(
      swaggerUi.generateHTML(
        await import('swagger-output.json'),
        undefined,
        undefined,
        undefined,
        'https://avatars.githubusercontent.com/u/110610705?s=45',
        undefined,
        'CTEC API Docs',
      ),
    );
  });

  app.use(router);

  return app;
};
