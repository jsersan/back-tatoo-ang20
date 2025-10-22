import { IOrder } from '../interfaces/order.interface';
import OrderModelFactory from '../models/order.model';
import UserModelFactory from '../models/user.model';
import OrderLineModelFactory from '../models/order-line.model';
import { sequelize } from '../config/database';

const OrderModel = OrderModelFactory(sequelize, require('sequelize').DataTypes);
const UserModel = UserModelFactory(sequelize, require('sequelize').DataTypes);
const OrderLineModel = OrderLineModelFactory(sequelize, require('sequelize').DataTypes);

export class OrderService {
  async getOrdersByUser(userId: number): Promise<IOrder[]> {
    const orders = await OrderModel.findAll({ where: { iduser: userId } });
    return orders.map(o => o.get({ plain: true }) as IOrder);
  }

  async getOrderById(orderId: number): Promise<IOrder | null> {
    const order = await OrderModel.findByPk(orderId);
    return order ? (order.get({ plain: true }) as IOrder) : null;
  }

  // La clave está aquí: acepta tipo Omit<IOrder, 'id'>
  async createOrder(orderData: Omit<IOrder, 'id'>): Promise<IOrder> {
    const order = await OrderModel.create(orderData);
    return order.get({ plain: true }) as IOrder;
  }

  async getUserData(userId: number): Promise<any> {
    const user = await UserModel.findByPk(userId);
    return user ? user.get({ plain: true }) : null;
  }

  async getOrderLines(orderId: number): Promise<any[]> {
    const lines = await OrderLineModel.findAll({ where: { idpedido: orderId } });
    return lines.map(l => l.get({ plain: true }));
  }
}


