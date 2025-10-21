// src/models/index.ts - Configuración completa de modelos

import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// ✅ Importar TODOS los modelos necesarios
import productModel from './product.model';
import categoryModel from './category.model';
import orderModel from './order.model';
import orderLineModel from './order-line.model';
import userModel from './user.model';

// ✅ Configuración de conexión a la base de datos mejorada
const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASS!, 
  {
    host: process.env.DB_HOST!,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// ✅ Crear objeto de base de datos COMPLETO con todos los modelos
const db: any = {
  sequelize,
  Sequelize,
  
  // Modelos principales
  Product: productModel(sequelize, DataTypes),
  Category: categoryModel(sequelize, DataTypes),
  Order: orderModel(sequelize, DataTypes),
  OrderLine: orderLineModel(sequelize, DataTypes),
  User: userModel(sequelize, DataTypes)
};

// ✅ Establecer asociaciones entre modelos
console.log('🔗 Estableciendo asociaciones entre modelos...');

// ✅ Verificar que todos los modelos tienen el método associate
Object.keys(db).forEach(modelName => {
  if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
    const model = db[modelName];
    if (typeof model.associate === 'function') {
      console.log(`🔗 Estableciendo asociaciones para ${modelName}`);
      model.associate(db);
    } else {
      console.warn(`⚠️ Modelo ${modelName} no tiene método associate`);
    }
  }
});

// ✅ Función para verificar la conexión a la base de datos
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // ✅ En desarrollo, verificar y sincronizar modelos
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Modo desarrollo: verificando modelos...');
      
      // Verificar que las tablas existan (sin alterar estructura en producción)
      await sequelize.sync({ alter: false });
      console.log('📋 Modelos sincronizados con la base de datos');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
};

// ✅ Función para obtener estadísticas de la base de datos
const getDatabaseStats = async () => {
  try {
    const stats = await Promise.all([
      db.User.count(),
      db.Product.count(),
      db.Category.count(),
      db.Order.count(),
      db.OrderLine.count()
    ]);
    
    console.log('📊 Estadísticas de la base de datos:', {
      usuarios: stats[0],
      productos: stats[1],
      categorias: stats[2],
      pedidos: stats[3],
      lineasPedido: stats[4]
    });
    
    return {
      users: stats[0],
      products: stats[1],
      categories: stats[2],
      orders: stats[3],
      orderLines: stats[4]
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return null;
  }
};

// ✅ Añadir métodos de utilidad al objeto db
db.testConnection = testConnection;
db.getDatabaseStats = getDatabaseStats;

// ✅ Función para inicializar la base de datos
const initializeDatabase = async () => {
  console.log('🚀 Inicializando base de datos...');
  
  const connected = await testConnection();
  if (!connected) {
    throw new Error('No se pudo conectar a la base de datos');
  }
  
  // Solo en desarrollo, mostrar estadísticas
  if (process.env.NODE_ENV === 'development') {
    await getDatabaseStats();
  }
  
  console.log('✅ Base de datos inicializada correctamente');
  return true;
};

db.initialize = initializeDatabase;

export default db;