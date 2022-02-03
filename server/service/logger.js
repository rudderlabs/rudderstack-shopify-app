import winston from 'winston';

const createLogger = () => {
  let logger;
  const toCheck = process.env.MODE || process.env.NODE_ENV;
  switch (toCheck) {
    case 'test':
      logger = winston.createLogger({
        silent: true,
      });
      break;
    case 'dev':
    case 'local':
    case 'development':
      logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.printf((info) => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          }),
        ),
        transports: [new winston.transports.Console()],
      });
      break;
    case 'prod':
    case 'production':
    default:
      logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.printf((info) => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          }),
        ),
        transports: [new winston.transports.Console()],
      });
  }
  logger.stream = {
    write(message, encoding) {
      logger.info(message);
    },
  };

  return logger;
};


export default createLogger();