import winston, { format } from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'dashboard-api' },
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.simple(),
        format.printf((info) => {
          return `[${info.service}] ${info.timestamp} [${info.level}]: ${info.message}`;
        }),
      ),
    }),

    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
