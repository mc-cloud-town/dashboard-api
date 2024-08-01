import { config } from 'dotenv';

import { createServer } from './server';
import { logger, BOT_ID_KEY, DiscordBot } from './service';
import { setupES256Key } from './util/jwt';
import { connectDatabase, DB_ID_KEY } from './service/database';

config({ debug: process.env.NODE_ENV !== 'production' });

const main = async () => {
  const db = await connectDatabase();
  const bot = new DiscordBot();
  const app = createServer();
  const port = process.env.PORT || 8000;

  setupES256Key();

  bot.login();
  app.set(DB_ID_KEY, db);
  app.set(BOT_ID_KEY, bot);
  app.listen(port, () => {
    logger.info(`Server started on port http://localhost:${port}`);
  });
};

main();

// process
//   .on('uncaughtException', logger.error)
//   .on('unhandledRejection', logger.error);
