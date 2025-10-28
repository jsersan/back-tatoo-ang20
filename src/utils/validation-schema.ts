/**
 * Esquemas de validación con Zod
 * Define esquemas para validar datos de entrada en las solicitudes
 */
import { z } from 'zod';

/**
 * Esquema para validar solicitudes de inicio de sesión
 */
export const loginSchema = z.object({
  username: z.string()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(30, { message: 'El nombre de usuario no puede exceder los 30 caracteres' }),
  password: z.string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
});

/**
 * Esquema para validar solicitudes de registro
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(30, { message: 'El nombre de usuario no puede exceder los 30 caracteres' }),
  password: z.string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  email: z.string()
    .email({ message: 'Debe proporcionar un correo electrónico válido' }),
  nombre: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  direccion: z.string()
    .min(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
  ciudad: z.string()
    .min(2, { message: 'La ciudad debe tener al menos 2 caracteres' }),
  cp: z.string()
    .regex(/^\d{5}$/, { message: 'El código postal debe tener 5 dígitos' })
});

/**
 * Esquema para validar solicitudes de actualización de usuario
 */
export const updateUserSchema = z.object({
  password: z.string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    .optional(),
  email: z.string()
    .email({ message: 'Debe proporcionar un correo electrónico válido' })
    .optional(),
  nombre: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .optional(),
  direccion: z.string()
    .min(5, { message: 'La dirección debe tener al menos 5 caracteres' })
    .optional(),
  ciudad: z.string()
    .min(2, { message: 'La ciudad debe tener al menos 2 caracteres' })
    .optional(),
  cp: z.string()
    .regex(/^\d{5}$/, { message: 'El código postal debe tener 5 dígitos' })
    .optional()
});

/**
 * Esquema para validar solicitudes de creación/actualización de categoría
 */
export const categorySchema = z.object({
  nombre: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder los 100 caracteres' }),
  padre: z.string()
    .regex(/^\d+$/, { message: 'El ID del padre debe ser un número' })
});

/**
 * Esquema para validar solicitudes de creación/actualización de producto
 */
export const productSchema = z.object({
  nombre: z.string()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(100, { message: 'El nombre no puede exceder los 100 caracteres' }),
  descripcion: z.string()
    .min(10, { message: 'La descripción debe tener al menos 10 caracteres' }),
  precio: z.union([
    z.string()
      .regex(/^\d+(\.\d{1,2})?$/, { message: 'El precio debe ser un número con máximo 2 decimales' })
      .transform((val) => parseFloat(val)),
    z.number().positive({ message: 'El precio debe ser mayor a 0' })
  ]),
  carpetaimg: z.string()
    .min(1, { message: 'Debe proporcionar el nombre de la carpeta de imágenes' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'La carpeta solo puede contener letras, números, guiones y guiones bajos' }),
  imagen: z.string()
    .min(1, { message: 'Debe proporcionar el nombre de la imagen principal' }),
  categoria: z.union([
    z.string()
      .regex(/^\d+$/, { message: 'El ID de la categoría debe ser un número' })
      .transform((val) => parseInt(val)),
    z.number().int({ message: 'El ID de la categoría debe ser un número entero' })
  ])
});

/**
 * Esquema para validar solicitudes de creación de color de producto
 */
export const productColorSchema = z.object({
  color: z.string()
    .min(1, { message: 'Debe proporcionar el nombre del color' })
    .max(50, { message: 'El nombre del color no puede exceder los 50 caracteres' }),
  imagen: z.string()
    .min(1, { message: 'Debe proporcionar el nombre de la imagen' })
});

/**
 * Esquema para validar líneas de pedido
 */
export const orderLineSchema = z.object({
  idprod: z.number().int({ message: 'El ID del producto debe ser un número entero' }),
  color: z.string().min(1, { message: 'Debe proporcionar el color seleccionado' }),
  cant: z.number().int({ message: 'La cantidad debe ser un número entero' })
    .positive({ message: 'La cantidad debe ser mayor a 0' }),
  nombre: z.string().optional()
});

/**
 * Esquema para validar solicitudes de creación de pedido
 */
export const orderSchema = z.object({
  iduser: z.number().int({ message: 'El ID del usuario debe ser un número entero' }),
  fecha: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
    .optional(),
  total: z.number()
    .positive({ message: 'El total debe ser mayor a 0' }),
  lineas: z.array(orderLineSchema)
    .min(1, { message: 'El pedido debe contener al menos un producto' })
});

/**
 * Middleware para validar solicitudes con Zod
 * @param schema Esquema Zod para validar
 * @returns Middleware de Express
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Reemplazar con datos validados y transformados
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        // Formatear errores de Zod
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Error de validación',
          errors
        });
      }
      
      // Error desconocido
      next(error);
    }
  };
};