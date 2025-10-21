// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';

interface TokenPayload {
  id: number;
  iat: number;
  exp: number;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }
    
    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Token mal formateado' });
      return;
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, authConfig.secret) as TokenPayload;
    
    // Añadir el ID del usuario al request
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware opcional para rutas que pueden requerir autenticación
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }
    
    const decoded = jwt.verify(token, authConfig.secret) as TokenPayload;
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin establecer userId
    next();
  }
};

// Alias para compatibilidad
export const authMiddleware = verifyToken;