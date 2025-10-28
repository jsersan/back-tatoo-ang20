// backend/services/order.service.ts - VERSIÓN CORREGIDA

import db from '../models'
import { IOrder } from '../interfaces/order.interface'

export class OrderService {
  // Crear pedido con líneas incluidas (CORREGIDO - ahora guarda el precio en cada línea)
  async createOrder (orderData: any) {
    console.log("📦 CREAR PEDIDO - Datos recibidos:", JSON.stringify(orderData, null, 2));
    
    // ✅ CRÍTICO: Asegurar que cada línea tenga el campo precio
    if (orderData.lineas && Array.isArray(orderData.lineas)) {
      orderData.lineas = orderData.lineas.map((linea: any) => {
        // Si la línea tiene precio, usarlo; si no, calcularlo o ponerlo en 0
        const precioFinal = linea.precio !== undefined && linea.precio !== null 
          ? Number(linea.precio) 
          : 0;
        
        console.log(`   Línea: ${linea.nombre} - Precio: ${precioFinal}`);
        
        return {
          ...linea,
          precio: precioFinal  // ✅ Asegurar que precio está presente
        };
      });
    }
    
    console.log("📦 Líneas procesadas con precios:", JSON.stringify(orderData.lineas, null, 2));
    
    // Crear el pedido con las líneas
    const pedido = await db.Order.create(orderData, {
      include: [{ model: db.OrderLine, as: 'lineas' }]
    });
    
    console.log("✅ PEDIDO CREADO con ID:", pedido.id);
    
    return pedido;
  }

  // Consultar pedidos de usuario, incluyendo líneas
  async getOrdersByUserWithLines (userId: number): Promise<IOrder[]> {
    const orders = await db.Order.findAll({
      where: { iduser: userId },
      include: [{ model: db.OrderLine, as: 'lineas' }],
      order: [['fecha', 'DESC'], ['id', 'DESC']]  // Más recientes primero
    })
    
    return orders.map((o: any) => o.get({ plain: true }) as IOrder)
  }

  // Consultar por ID incluyendo líneas
  async getOrderByIdWithLines (orderId: number): Promise<IOrder | null> {
    const order = await db.Order.findByPk(orderId, {
      include: [{ model: db.OrderLine, as: 'lineas' }]
    })
    return order ? (order.get({ plain: true }) as IOrder) : null
  }

  // Consultar líneas específicas separadas
  async getOrderLines (orderId: number): Promise<any[]> {
    const lines = await db.OrderLine.findAll({ 
      where: { idpedido: orderId } 
    })
    return lines.map((l: any) => l.get({ plain: true }))
  }

  // Consultar usuario (opcional, si tu código lo usa)
  async getUserData (userId: number): Promise<any | null> {
    const user = await db.User.findByPk(userId)
    return user ? user.get({ plain: true }) : null
  }
}



