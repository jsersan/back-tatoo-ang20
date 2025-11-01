/**
 * Sistema de logging estructurado para la aplicación
 * Optimizado para funcionar en Render (producción) y local (desarrollo)
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Directorio para logs - en producción usar /tmp (Render), en desarrollo usar ./logs
const logDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/logs'  
  : path.join(__dirname, '../../logs');

// Función para crear el directorio de logs de forma segura
const ensureLogDir = () => {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.warn('No se pudo crear directorio de logs, usando solo consola:', error);
  }
};

// Formato personalizado para los logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato personalizado para los logs de consola
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length 
      ? '\n' + JSON.stringify(meta, null, 2) 
      : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Configuración de transportes para diferentes entornos
const getTransports = () => {
  const transports: winston.transport[] = [];

  // En desarrollo, mostrar logs en consola con colores
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: consoleFormat
      })
    );
    
    // En desarrollo también guardar en archivo
    try {
      ensureLogDir();
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat
        })
      );
    } catch (error) {
      console.warn('No se pueden crear archivos de log en desarrollo');
    }
  } else {
    // En producción, usar principalmente consola (Render captura esto)
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
    
    // Intentar crear archivo de logs en /tmp si es posible
    try {
      ensureLogDir();
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 2
        })
      );
    } catch (error) {
      // Si no se puede escribir en disco, solo usar consola
      console.warn('Logs solo en consola (no se puede escribir en disco)');
    }
  }

  return transports;
};

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  format: logFormat,
  transports: getTransports(),
  exitOnError: false
});

// Formatear objetos de error para logging
const formatError = (error: any): object => {
  return {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...error
  };
};

// Middleware para logging de solicitudes HTTP
export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (res.statusCode < 400) {
      logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    } else if (res.statusCode < 500) {
      logger.warn('HTTP Request (Client Error)', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    } else {
      logger.error('HTTP Request (Server Error)', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  
  next();
};

// Exportar el logger personalizado con métodos convenientes
export default {
  error: (message: string, meta?: any) => {
    return logger.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    return logger.warn(message, meta);
  },
  info: (message: string, meta?: any) => {
    return logger.info(message, meta);
  },
  debug: (message: string, meta?: any) => {
    return logger.debug(message, meta);
  },
  logError: (message: string, error: any) => {
    return logger.error(message, formatError(error));
  },
  auth: (message: string, user: string | number, meta?: any) => {
    return logger.info(message, { user, ...meta });
  }
};
