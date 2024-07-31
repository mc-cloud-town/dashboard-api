import { config } from 'dotenv';

import { createServer } from './server';
import { logger, BOT_ID_KEY, DiscordBot } from './service';

config({ debug: process.env.NODE_ENV !== 'production' });

const main = () => {
  const bot = new DiscordBot();
  const app = createServer();
  const port = process.env.PORT || 8000;

  bot.login();
  app.set(BOT_ID_KEY, bot);
  app.listen(port, () => {
    logger.info(`Server started on port http://localhost:${port}`);
  });
};

main();

process
  .on('uncaughtException', console.error)
  .on('unhandledRejection', console.error);
