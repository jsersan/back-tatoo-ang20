/**
 * Rutas de Productos
 * Define los endpoints de la API para productos
 */
import { Router } from 'express';
import productController from '../controllers/product.controller';

const router = Router();

// ⚠️ ORDEN CRÍTICO: Las rutas específicas deben ir ANTES de las rutas con parámetros

// 🔍 Búsqueda de productos (debe ir PRIMERO)
router.get('/search', productController.search.bind(productController));

// 📦 Productos por categoría (específico antes de :id)
router.get('/categoria/:categoryId', productController.getProductsByCategory.bind(productController));

// 🎨 Colores de un producto específico
router.get('/:id/colors', productController.getColors.bind(productController));

// 🖼️ Imagen de producto
router.get('/image/:categoria/:imagen', productController.getImage.bind(productController));

// 📋 CRUD básico
router.get('/', productController.index.bind(productController));
router.post('/', productController.store.bind(productController));

// ⚠️ Rutas con :id deben ir AL FINAL para evitar conflictos
router.get('/:id', productController.show.bind(productController));
router.put('/:id', productController.update.bind(productController));
router.delete('/:id', productController.destroy.bind(productController));

export default router;