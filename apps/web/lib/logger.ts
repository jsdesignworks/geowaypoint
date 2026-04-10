type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[geowaypoint:web]';

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const payload = meta ? { message, ...meta } : { message };
  const line = `${PREFIX} ${message}`;

  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV !== 'production') console.debug(line, meta ?? '');
      break;
    case 'info':
      console.info(line, meta ?? '');
      break;
    case 'warn':
      console.warn(line, meta ?? '');
      break;
    case 'error':
      console.error(line, meta ?? '');
      break;
    default:
      console.log(line, payload);
  }
}

/** Baseline logging — explicit, no silent failures; Sentry captures errors separately when DSN is set. */
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta),
};
