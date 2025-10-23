// backend/services/order.service.ts

import db from '../models';
import { IOrder } from '../interfaces/order.interface';

export class OrderService {

  // Crear pedido con líneas incluidas (CRÍTICO)
  async createOrder(orderData: any): Promise<IOrder> {
    const newOrder = await db.Order.create(orderData, {
      include: [{ model: db.OrderLine, as: 'lineas' }]
    });
    return newOrder.get({ plain: true }) as IOrder;
  }

  // Consultar pedidos de usuario, incluyendo líneas
  async getOrdersByUserWithLines(userId: number): Promise<IOrder[]> {
    const orders = await db.Order.findAll({
      where: { iduser: userId },
      include: [{ model: db.OrderLine, as: 'lineas' }]
    });
    return orders.map((o: any) => o.get({ plain: true }) as IOrder);
  }

  // Consultar por ID incluyendo líneas
  async getOrderByIdWithLines(orderId: number): Promise<IOrder | null> {
    const order = await db.Order.findByPk(orderId, {
      include: [{ model: db.OrderLine, as: 'lineas' }]
    });
    return order ? (order.get({ plain: true }) as IOrder) : null;
  }

  // Consultar líneas específicas separadas
  async getOrderLines(orderId: number): Promise<any[]> {
    const lines = await db.OrderLine.findAll({ where: { idpedido: orderId } });
    return lines.map((l: any) => l.get({ plain: true }));
  }

  // Consultar usuario (opcional, si tu código lo usa)
  async getUserData(userId: number): Promise<any | null> {
    const user = await db.User.findByPk(userId);
    return user ? user.get({ plain: true }) : null;
  }
}




