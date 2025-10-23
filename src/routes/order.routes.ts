import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

// Obtener todos los pedidos de un usuario
router.get('/user/:userId', OrderController.getUserOrders);

// Descargar albarÃ¡n PDF de un pedido concreto (GET por id)
router.get('/albaran/:pedidoId', OrderController.descargarAlbaran);

// Crear nuevo pedido (y enviar albarÃ¡n por email)
router.post('/', OrderController.createOrder);

// Reenviar albarÃ¡n por email
router.post('/reenviar-albaran/:pedidoId', OrderController.reenviarAlbaran);

export default router;
