import { createServer } from './server';

import {} from 'dotenv';

const main = () => {
  const app = createServer();
  const port = process.env.PORT || 8000;

  app.listen(port, () => {
    console.log(`Server started on port http://localhost:${port}`);
  });
};

main();

process
  .on('uncaughtException', console.error)
  .on('unhandledRejection', console.error);
