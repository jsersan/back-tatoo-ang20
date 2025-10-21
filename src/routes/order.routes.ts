// src/routes/order.routes.ts - Con tipos explícitos para resolver errores de TypeScript

import { Router, Request, Response } from 'express'; // ✅ Importar tipos de Express
import orderController from '../controllers/order.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/admin.middleware';

// Crear un router para las rutas de pedido
const router = Router();

// ✅ Todas las rutas de pedidos requieren autenticación

/**
 * GET /api/pedidos/user/:userId
 * Obtiene pedidos de un usuario específico
 * Requiere: Autenticación (usuario propietario o admin)
 */
router.get('/user/:userId', verifyToken, orderController.findByUser);

/**
 * GET /api/pedidos/summary
 * Obtiene resumen de pedidos del usuario actual
 * Requiere: Autenticación
 */
router.get('/summary', verifyToken, (_req: Request, res: Response) => {
  // ✅ Tipos explícitos para evitar 'any' implícito
  // Implementación básica de resumen
  res.status(200).json({
    message: 'Resumen de pedidos',
    totalOrders: 0,
    totalSpent: 0,
    lastOrder: null
  });
});

/**
 * GET /api/pedidos/:id
 * Obtiene un pedido específico con todos sus detalles
 * Requiere: Autenticación (usuario propietario o admin)
 */
router.get('/:id', verifyToken, orderController.findOne);

/**
 * POST /api/pedidos
 * Crea un nuevo pedido
 * Requiere: Autenticación
 */
router.post('/', verifyToken, orderController.create);

/**
 * PATCH /api/pedidos/:id/cancel
 * Cancela un pedido (si está permitido)
 * Requiere: Autenticación (usuario propietario)
 */
router.patch('/:id/cancel', verifyToken, (req: Request, res: Response) => {
  // ✅ Tipos explícitos para req y res
  // Implementación básica de cancelación
  res.status(200).json({
    message: 'Pedido cancelado',
    orderId: req.params.id
  });
});

/**
 * PATCH /api/pedidos/:id/status
 * Actualiza el estado de un pedido (solo admin)
 * Requiere: Autenticación + permisos de admin
 */
router.patch('/:id/status', [verifyToken, isAdmin], (req: Request, res: Response) => {
  // ✅ Tipos explícitos para req y res
  // Implementación básica de cambio de estado
  res.status(200).json({
    message: 'Estado del pedido actualizado',
    orderId: req.params.id,
    newStatus: req.body.status
  });
});

/**
 * GET /api/pedidos (solo admin)
 * Obtiene todos los pedidos del sistema
 * Requiere: Autenticación + permisos de admin
 */
router.get('/', [verifyToken, isAdmin], async (_req: Request, res: Response) => {
  // ✅ Tipos explícitos para _req y res
  try {
    // Implementación básica para obtener todos los pedidos
    res.status(200).json({
      message: 'Lista de todos los pedidos',
      orders: []
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener pedidos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;