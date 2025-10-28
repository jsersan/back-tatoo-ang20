import { Model, DataTypes, Sequelize, ModelStatic, Optional } from 'sequelize';
import { IOrderLine } from '../interfaces/order.interface';

// Definir qué campos son opcionales al crear
interface OrderLineCreationAttributes extends Optional<IOrderLine, 'id'> {}

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes): ModelStatic<Model<IOrderLine, OrderLineCreationAttributes>> {
  /**
   * Clase OrderLine que extiende el Model de Sequelize
   * Implementa la interfaz IOrderLine para tipado fuerte
   */
  class OrderLine extends Model<IOrderLine, OrderLineCreationAttributes> implements IOrderLine {
    // Propiedades del modelo
    public id!: number;
    public idpedido!: number;
    public idprod!: number;
    public color!: string;
    public cant!: number;
    public nombre?: string;
    public precio!: number;

    // Timestamps automáticos de Sequelize
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    /**
     * Método estático para definir asociaciones con otros modelos
     * @param models Objeto con todos los modelos disponibles
     */
    public static associate(models: any) {
      // Una línea de pedido pertenece a un pedido
      OrderLine.belongsTo(models.Order, {
        foreignKey: 'idpedido',
        as: 'order'
      });

      // Una línea de pedido está asociada a un producto
      OrderLine.belongsTo(models.Product, {
        foreignKey: 'idprod',
        as: 'product'
      });
    }
  }

  // Inicializar el modelo con sus atributos y opciones
  OrderLine.init(
    {
      id: { 
        type: dataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      idpedido: { 
        type: dataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'pedido', key: 'id' },
        comment: 'ID del pedido al que pertenece esta línea' 
      },
      idprod: { 
        type: dataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'producto', key: 'id' },
        comment: 'ID del producto incluido en esta línea' 
      },
      color: { 
        type: dataTypes.STRING, 
        allowNull: false, 
        comment: 'Color seleccionado para el producto' 
      },
      cant: { 
        type: dataTypes.INTEGER, 
        allowNull: false, 
        validate: { min: 1 }, 
        comment: 'Cantidad del producto' 
      },
      nombre: { 
        type: dataTypes.STRING, 
        allowNull: true, 
        comment: 'Nombre del producto (histórico aunque se modifique el producto)' 
      },
      precio: { 
        type: dataTypes.DECIMAL(10, 2), 
        allowNull: false,
        defaultValue: 0,
        comment: 'Precio unitario del producto en la línea'
      }
    },
    {
      sequelize,
      modelName: 'OrderLine',
      tableName: 'lineapedido',
      timestamps: false,
      indexes: [
        { fields: ['idpedido'] }, 
        { fields: ['idprod'] }
      ]
    }
  );  
  
  return OrderLine;
}