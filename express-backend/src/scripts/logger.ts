import { createLogger, format, transports } from 'winston';

export default createLogger({
  level: 'debug',
  format: format.combine(
    format.json(),
    format.timestamp(),
    format.metadata(),
    format.prettyPrint(),
    format.colorize({
      all: true,
    }),
  ),
  transports: [new transports.Console()],
});
