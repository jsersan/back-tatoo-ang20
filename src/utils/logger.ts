/**
 * Sistema de logging estructurado para la aplicación
 * Utiliza Winston para generación de logs con diferentes niveles
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Directorio para almacenar los archivos de logs
// const logDir = path.join(__dirname, '../../logs');

// // Crear el directorio de logs si no existe
// if (!fs.existsSync(logDir)) {
//   fs.mkdirSync(logDir, { recursive: true });
// }

const logDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/logs'  // En Render usa /tmp
  : path.join(__dirname, '../../logs');

// Crear directorio solo cuando el logger se use, no al importar
const ensureLogDir = () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
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
  ensureLogDir();
  const transports = [
    // Siempre guardar logs de errores en archivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat
    }),
  ];

  // En desarrollo, mostrar logs en consola con colores
  if (process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: consoleFormat
      }) as any
    );
  } else {
    // En producción, guardar todos los logs en archivo
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat
      }) as any
    );
  }

  return transports;
};

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  format: logFormat,
  transports: getTransports(),
  // No salir ante errores no manejados
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
  // Registrar la solicitud entrante
  const start = Date.now();
  
  // Registrar al final de la solicitud
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log a nivel de información para solicitudes normales
    if (res.statusCode < 400) {
      logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    } 
    // Log a nivel de advertencia para errores de cliente
    else if (res.statusCode < 500) {
      logger.warn('HTTP Request (Client Error)', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    } 
    // Log a nivel de error para errores de servidor
    else {
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
  // Niveles de log estándar
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
  
  // Método específico para errores
  logError: (message: string, error: any) => {
    return logger.error(message, formatError(error));
  },
  
  // Método para logs de acceso/autenticación
  auth: (message: string, user: string | number, meta?: any) => {
    return logger.info(message, { user, ...meta });
  }
};
