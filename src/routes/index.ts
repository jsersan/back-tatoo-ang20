// ===============================
// src/routes/index.ts - Rutas principales actualizadas
// ===============================

import { Router } from 'express';
import userRoutes from './user.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes'; // ✅ Descomentado

// Crear un router para todas las rutas
const router = Router();

// ✅ Registrar todas las rutas por dominio
router.use('/users', userRoutes);
router.use('/categorias', categoryRoutes);
router.use('/productos', productRoutes);
router.use('/pedidos', orderRoutes); // ✅ Habilitado y corregido el nombre

// ✅ Ruta de health check
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Ruta para obtener información de la API
router.get('/info', (req, res) => {
  res.status(200).json({
    name: 'TatooDenda API',
    version: '1.0.0',
    description: 'API para la tienda online de tatuajes y piercings',
    endpoints: {
      users: '/api/users',
      categories: '/api/categorias',
      products: '/api/productos',
      orders: '/api/pedidos'
    }
  });
});

export default router;