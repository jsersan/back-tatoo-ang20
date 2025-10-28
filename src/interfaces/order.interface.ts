export interface IOrder {
  id?: number;           // ID único (opcional para nuevos pedidos)
  iduser: number;       // ID del usuario que realiza el pedido
  fecha: string;        // Fecha del pedido en formato YYYY-MM-DD
  total: number;        // Importe total del pedido
  lineas?: IOrderLine[]; // Líneas del pedido (productos)
}

export interface IOrderLine {
  id?: number;           // ID único
  idpedido: number;      // ID del pedido al que pertenece
  idprod: number;        // ID del producto
  color: string;         // Color seleccionado
  cant: number;          // Cantidad
  nombre?: string;       // Nombre del producto (opcional, para mostrar)
  precio: number;        // ✅ CRÍTICO: Precio unitario (ya no es opcional)
}

export interface ICartItem {
  id: number;            // ID del producto
  nombre: string;        // Nombre del producto
  precio: number;        // Precio unitario
  color: string;         // Color seleccionado
  cantidad: number;      // Cantidad
  imagen: string;        // Ruta a la imagen
}

export interface IOrderDetail extends IOrder {
  user?: {                // Información del usuario
    nombre: string;
    email: string;
  };
  lineas: Array<IOrderLine & {  // Líneas con información adicional
    product?: {
      nombre: string;
      precio: number;
      imagen: string;
    }
  }>;
}