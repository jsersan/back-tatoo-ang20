// src/server.ts - Servidor principal completo y mejorado

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno desde archivo .env
dotenv.config();

// Importaciones internas
import db from './models';
import routes from './routes';
import { errorHandler } from './utils/error-handler';

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor TatooDenda...');
console.log('📍 Puerto configurado:', PORT);
console.log('🌐 Entorno:', process.env.NODE_ENV || 'development');

// ✅ Configurar CORS más permisivo para desarrollo
const corsOptions = {
  origin: [
    'http://localhost:4200', 
    'http://127.0.0.1:4200', 
    'http://localhost:3000',
    'http://localhost:4201' // Por si usas otro puerto
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Headers'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// ✅ Middleware de logging para debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Log de headers de autenticación (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && req.headers.authorization) {
    console.log('🔑 Authorization header presente:', req.headers.authorization.substring(0, 20) + '...');
  }
  
  // Log del body en peticiones POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// ✅ Middleware para parsear datos
app.use(express.json({ limit: '10mb' })); // Límite aumentado para imágenes
app.use(express.urlencoded({ extended: true }));

// ✅ Servir archivos estáticos (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// ✅ Ruta de health check antes de las rutas principales
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor TatooDenda funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ✅ Ruta de test básica
app.get('/test', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Backend TatooDenda funcionando correctamente',
    database: 'conectada',
    api: 'disponible en /api'
  });
});

// ✅ Configurar rutas de la API
app.use('/api', routes);

// ✅ Ruta para mostrar información de la API en la raíz
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'TatooDenda API',
    version: '1.0.0',
    description: 'API para la tienda online de tatuajes y piercings',
    status: 'running',
    endpoints: {
      health: '/health',
      test: '/test',
      api: '/api',
      users: '/api/users',
      categories: '/api/categorias',
      products: '/api/productos',
      orders: '/api/pedidos'
    },
    documentation: 'https://api.tatoodenda.com/docs'
  });
});

// ✅ Middleware para manejar rutas no encontradas
app.use((req: Request, res: Response) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    method: req.method,
    url: req.url,
    suggestion: 'Verifica que la URL sea correcta y que el endpoint exista'
  });
});

// ✅ Middleware para manejo global de errores
app.use(errorHandler);

// ✅ Función para verificar conexión a la base de datos
const connectDatabase = async (): Promise<boolean> => {
  try {
    console.log('🔌 Conectando a la base de datos...');
    console.log('📍 Host:', process.env.DB_HOST);
    console.log('📍 Base de datos:', process.env.DB_NAME);
    console.log('📍 Usuario:', process.env.DB_USER);
    
    await db.sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // ✅ Inicializar base de datos (verificar modelos, estadísticas, etc.)
    if (db.initialize) {
      await db.initialize();
    }
    
    // ✅ Solo sincronizar en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Modo desarrollo: sincronizando modelos...');
      await db.sequelize.sync({ alter: false }); // No alterar estructura en prod
      console.log('📋 Modelos sincronizados correctamente');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:');
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Puerto: 3306 (MySQL default)');
    console.error('   Base de datos:', process.env.DB_NAME);
    console.error('   Usuario:', process.env.DB_USER);
    console.error('   Error:', err);
    
    // ✅ Sugerencias de troubleshooting
    console.error('\n🔧 Troubleshooting sugerido:');
    console.error('   1. Verificar que MySQL esté ejecutándose');
    console.error('   2. Verificar credenciales en el archivo .env');
    console.error('   3. Verificar que la base de datos exista');
    console.error('   4. Verificar conectividad de red al host');
    
    return false;
  }
};

// ✅ Función para mostrar información del servidor al iniciar
const showServerInfo = () => {
  console.log('\n🎉 ================================');
  console.log('🎉 SERVIDOR TATOODENDA INICIADO');
  console.log('🎉 ================================');
  console.log(`🌐 Servidor ejecutándose en puerto: ${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URLs disponibles:`);
  console.log(`   • Health check: http://localhost:${PORT}/health`);
  console.log(`   • Test endpoint: http://localhost:${PORT}/test`);
  console.log(`   • API base: http://localhost:${PORT}/api`);
  console.log(`   • API info: http://localhost:${PORT}/api/info`);
  console.log(`   • Usuarios: http://localhost:${PORT}/api/users`);
  console.log(`   • Categorías: http://localhost:${PORT}/api/categorias`);
  console.log(`   • Productos: http://localhost:${PORT}/api/productos`);
  console.log(`   • Pedidos: http://localhost:${PORT}/api/pedidos`);
  console.log('🎉 ================================\n');
};

// ✅ Arrancar servidor con verificaciones completas
const startServer = async () => {
  try {
    console.log('🚀 Iniciando proceso de arranque del servidor...');
    
    // 1. Verificar conexión a base de datos
    const dbConnected = await connectDatabase();
    
    if (!dbConnected) {
      console.error('❌ No se puede iniciar el servidor sin conexión a la base de datos');
      console.error('💡 Verifica tu configuración de base de datos en el archivo .env');
      process.exit(1);
    }
    
    // 2. Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      showServerInfo();
    });
    
    // 3. Configurar manejo de cierre graceful
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📴 Recibida señal ${signal}, cerrando servidor gracefully...`);
      
      server.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');
        
        try {
          await db.sequelize.close();
          console.log('🔌 Conexión a base de datos cerrada');
        } catch (error) {
          console.error('❌ Error al cerrar conexión a base de datos:', error);
        }
        
        console.log('👋 Servidor cerrado completamente');
        process.exit(0);
      });
    };
    
    // 4. Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('💥 Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

// ✅ Manejo de errores no capturados para evitar caídas del servidor
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('   Esto podría indicar un problema en el código que necesita atención');
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('   Esto es un error crítico, el servidor se cerrará');
  process.exit(1);
});

// ✅ Iniciar servidor
startServer();

// ✅ Exportar app para testing
export default app;