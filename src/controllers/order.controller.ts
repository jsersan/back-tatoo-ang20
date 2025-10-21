// src/controllers/order.controller.ts - Controlador completo y mejorado

import { Request, Response } from 'express'
import db from '../models'
import { IOrder, IOrderLine } from '../interfaces/order.interface'
import { Transaction } from 'sequelize'

// Referencias a los modelos necesarios
const Order = db.Order
const OrderLine = db.OrderLine
const User = db.User
const Product = db.Product

/**
 * Controlador de pedidos mejorado y completo
 */
const orderController = {
  /**
   * ✅ Obtiene pedidos de un usuario específico
   * GET /api/pedidos/user/:userId
   */
  findByUser: async (req: Request, res: Response): Promise<Response> => {
    try {
      const userId = parseInt(req.params.userId)
      
      console.log('🚀 Buscando pedidos para usuario:', userId);
      console.log('🔑 Usuario autenticado:', req.userId);

      // ✅ Verificar que el parámetro es válido
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ 
          message: 'ID de usuario no válido' 
        });
      }

      // ✅ Verificar que el usuario autenticado está accediendo a sus propios pedidos o es admin
      if (req.userId !== userId && !(await isAdmin(req.userId))) {
        console.warn(`⚠️ Usuario ${req.userId} intentó acceder a pedidos de usuario ${userId}`);
        return res.status(403).json({ 
          message: 'No autorizado para ver estos pedidos' 
        })
      }

      // ✅ Verificar si el usuario existe
      const user = await User.findByPk(userId)
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        })
      }

      // ✅ Obtener pedidos con sus líneas y información de productos
      const orders = await Order.findAll({
        where: { iduser: userId },
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false // LEFT JOIN para que no falle si falta el producto
              }
            ]
          }
        ],
        order: [['fecha', 'DESC']] // Pedidos más recientes primero
      })

      console.log(`✅ Encontrados ${orders.length} pedidos para usuario ${userId}`);

      return res.status(200).json(orders)
    } catch (err) {
      console.error('❌ Error al obtener pedidos del usuario:', err)
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message })
      }
      return res.status(500).json({ message: 'Error al obtener pedidos' })
    }
  },

  /**
   * ✅ Obtiene un pedido específico con todos sus detalles
   * GET /api/pedidos/:id
   */
  findOne: async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id)
      
      console.log('🚀 Buscando pedido con ID:', id);
      console.log('🔑 Usuario autenticado:', req.userId);

      // ✅ Verificar que el parámetro es válido
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ 
          message: 'ID de pedido no válido' 
        });
      }

      // ✅ Buscar pedido por ID con todas las relaciones
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderLine,
            as: 'lineas',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'nombre', 'precio', 'imagen', 'carpetaimg'],
                required: false
              }
            ]
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nombre', 'email']
          }
        ]
      })

      if (!order) {
        return res.status(404).json({ 
          message: 'Pedido no encontrado' 
        })
      }

      // ✅ Verificar que el usuario autenticado es el propietario del pedido o un administrador
      if (order.get('iduser') !== req.userId && !(await isAdmin(req.userId))) {
        console.warn(`⚠️ Usuario ${req.userId} intentó acceder al pedido ${id} de otro usuario`);
        return res.status(403).json({ 
          message: 'No autorizado para ver este pedido' 
        })
      }

      console.log(`✅ Pedido ${id} encontrado y autorizado`);

      return res.status(200).json(order)
    } catch (err) {
      console.error('❌ Error al obtener pedido:', err)
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message })
      }
      return res.status(500).json({ message: 'Error al obtener el pedido' })
    }
  },

  /**
   * ✅ Crea un nuevo pedido (MÉTODO PRINCIPAL MEJORADO)
   * POST /api/pedidos
   */
  create: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('🚀 Creando nuevo pedido...');
      console.log('📦 Datos recibidos:', req.body);
      console.log('🔑 Usuario autenticado:', req.userId);

      // ✅ VERIFICACIÓN 1: Usuario autenticado
      const userId = req.userId;
      if (!userId) {
        console.error('❌ No hay usuario autenticado');
        return res.status(401).json({
          message: 'Usuario no autenticado'
        });
      }

      // ✅ VERIFICACIÓN 2: Datos del pedido
      const orderData = req.body;
      
      // Validar campos requeridos
      if (!orderData.total || orderData.total <= 0) {
        return res.status(400).json({
          message: 'El total del pedido debe ser mayor a 0'
        });
      }

      if (!orderData.lineas || !Array.isArray(orderData.lineas) || orderData.lineas.length === 0) {
        return res.status(400).json({ 
          message: 'El pedido debe contener al menos un producto' 
        });
      }

      // ✅ VERIFICACIÓN 3: Validar líneas de pedido
      for (let i = 0; i < orderData.lineas.length; i++) {
        const linea = orderData.lineas[i];
        
        if (!linea.idprod || linea.idprod <= 0) {
          return res.status(400).json({
            message: `Línea ${i + 1}: ID de producto no válido`
          });
        }
        
        if (!linea.cant || linea.cant <= 0) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Cantidad debe ser mayor a 0`
          });
        }
        
        if (!linea.color) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Color es requerido`
          });
        }

        // ✅ Verificar que el producto existe
        const product = await Product.findByPk(linea.idprod);
        if (!product) {
          return res.status(400).json({
            message: `Línea ${i + 1}: Producto con ID ${linea.idprod} no encontrado`
          });
        }
      }

      // ✅ PROCESAMIENTO: Crear pedido con transacción
      const result = await db.sequelize.transaction(async (t: Transaction) => {
        console.log('💾 Iniciando transacción de base de datos...');

        // ✅ 1. Crear el pedido principal
        const order = await Order.create(
          {
            iduser: userId, // ✅ Usar userId del token JWT
            fecha: orderData.fecha || new Date().toISOString().split('T')[0],
            total: parseFloat(orderData.total)
          },
          { transaction: t }
        )

        const orderId = order.get('id') as number;
        console.log(`✅ Pedido creado con ID: ${orderId}`);

        // ✅ 2. Crear líneas de pedido
        const orderLines: IOrderLine[] = orderData.lineas.map((line: any) => ({
          idpedido: orderId,
          idprod: line.idprod,
          color: line.color || 'Estándar',
          cant: line.cant, // ✅ El backend usa 'cant'
          nombre: line.nombre || ''
        }));

        await OrderLine.bulkCreate(orderLines, { transaction: t });
        console.log(`✅ Creadas ${orderLines.length} líneas de pedido`);

        // ✅ 3. Obtener el pedido completo con sus líneas
        const completeOrder = await Order.findByPk(orderId, {
          include: [
            {
              model: OrderLine,
              as: 'lineas'
            }
          ],
          transaction: t
        });

        return completeOrder;
      });

      console.log('✅ Pedido creado exitosamente:', result?.get('id'));

      return res.status(201).json(result)
    } catch (err) {
      console.error('❌ Error al crear pedido:', err)
      
      // ✅ Manejo de errores específicos
      if (err instanceof Error) {
        // Error de validación de Sequelize
        if (err.name === 'SequelizeValidationError') {
          return res.status(400).json({
            message: 'Error de validación en los datos',
            details: err.message
          });
        }
        
        // Error de clave foránea (producto no existe, etc.)
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          return res.status(400).json({
            message: 'Error de referencia: producto o usuario no válido',
            details: err.message
          });
        }
        
        return res.status(500).json({ 
          message: 'Error al crear el pedido',
          details: err.message 
        });
      }
      
      return res.status(500).json({ 
        message: 'Error al crear el pedido' 
      });
    }
  },

  /**
   * ✅ Obtiene todos los pedidos (solo admin)
   * GET /api/pedidos
   */
  findAll: async (req: Request, res: Response): Promise<Response> => {
    try {
      console.log('🚀 Obteniendo todos los pedidos (admin)');
      console.log('🔑 Usuario autenticado:', req.userId);

      // ✅ Verificar permisos de admin
      if (!(await isAdmin(req.userId))) {
        return res.status(403).json({
          message: 'Se requieren permisos de administrador'
        });
      }

      // ✅ Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // ✅ Obtener pedidos con paginación
      const { count, rows: orders } = await Order.findAndCountAll({
        include: [
          {
            model: OrderLine,
            as: 'lineas'
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'nombre', 'email']
          }
        ],
        order: [['fecha', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        orders,
        pagination: {
          total: count,
          page,
          pages: Math.ceil(count / limit),
          limit
        }
      });
    } catch (err) {
      console.error('❌ Error al obtener todos los pedidos:', err);
      if (err instanceof Error) {
        return res.status(500).json({ message: err.message });
      }
      return res.status(500).json({ message: 'Error al obtener pedidos' });
    }
  }
}

/**
 * ✅ Función auxiliar para verificar si un usuario es administrador
 */
const isAdmin = async (userId: number | undefined): Promise<boolean> => {
  if (!userId) return false

  try {
    const user = await User.findByPk(userId)
    const isAdminUser = user && (user.get('username') === 'admin' || user.get('role') === 'admin');
    
    console.log(`🔐 Verificación de admin para usuario ${userId}:`, isAdminUser);
    return isAdminUser;
  } catch (error) {
    console.error('❌ Error al verificar permisos de admin:', error);
    return false;
  }
}

export default orderController
