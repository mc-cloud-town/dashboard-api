import { connect } from 'mongoose';
import logger from './logger';

export const DB_ID_KEY = 'DB';
export const DB_NAME = 'CTEC-Dashboard';

export const connectDatabase = async () => {
  const url = process.env.DATABASE_URL ?? 'mongodb://localhost:27017';
  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;

  const database = await connect(url, {
    dbName: DB_NAME,
    auth: {
      username,
      password,
    },
    appName: 'CTEC-Dashboard',
    autoCreate: true,
    autoIndex: true,
  });
  logger.info('Database connected');

  return database;
};
