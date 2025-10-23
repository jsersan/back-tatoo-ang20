import { Model, DataTypes, Sequelize, ModelStatic } from 'sequelize';
import { IOrder } from '../interfaces/order.interface';

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes): ModelStatic<Model> {

  class Order extends Model implements IOrder {
    public id!: number;
    public iduser!: number;
    public fecha!: string;
    public total!: number;
    // Si usas timestamps automáticos, agrega aquí los atributos
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public static associate(models: any) {
      // Asociación con el usuario
      Order.belongsTo(models.User, {
        foreignKey: 'iduser',
        as: 'user'
      });

      // Asociación con las líneas del pedido
      Order.hasMany(models.OrderLine, {
        foreignKey: 'idpedido',
        as: 'lineas',
        onDelete: 'CASCADE'
      });
    }
  }

  Order.init({
    id: {
      type: dataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    iduser: {
      type: dataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      comment: 'ID del usuario que realizó el pedido'
    },
    fecha: {
      type: dataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Fecha en que se realizó el pedido'
    },
    total: {
      type: dataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      comment: 'Importe total del pedido'
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'pedido',
    timestamps: false,
    indexes: [
      { fields: ['iduser'] },
      { fields: ['fecha'] }
    ]
  });

  return Order;
}
