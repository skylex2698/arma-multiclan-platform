export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

/**
 * Lista de claves sensibles que deben ser redactadas en los logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'authorization',
  'cookie',
  'jwt',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurity',
];

/**
 * Sanitiza un objeto removiendo valores de claves sensibles
 */
const sanitizeLogData = (data: any, depth: number = 0): any => {
  // Prevenir recursión infinita
  if (depth > 10) return '[MAX_DEPTH]';

  if (data === null || data === undefined) return data;

  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Verificar si la clave contiene alguna palabra sensible
    const isSensitive = SENSITIVE_KEYS.some(
      sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Formatea un mensaje de log para producción (JSON) o desarrollo (legible)
 */
const formatLogMessage = (level: LogLevel, message: string, data?: any): string => {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // JSON estructurado para producción (mejor para herramientas de logging)
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(data ? { data: sanitizeLogData(data) } : {}),
    });
  }

  // Formato legible para desarrollo
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  if (data) {
    logMessage += '\n' + JSON.stringify(sanitizeLogData(data), null, 2);
  }
  return logMessage;
};

class Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const formattedMessage = formatLogMessage(level, message, data);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.log(LogLevel.ERROR, message, data);
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  /**
   * Log de auditoría para acciones importantes
   */
  audit(action: string, userId: string | undefined, data?: any) {
    this.log(LogLevel.INFO, `AUDIT: ${action}`, {
      userId: userId || 'anonymous',
      ...sanitizeLogData(data),
    });
  }
}

export const logger = new Logger();
