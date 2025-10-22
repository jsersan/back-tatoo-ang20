import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';

const orderService = new OrderService();
const pdfService = new PdfService();
const emailService = new EmailService();

// Define tu interfaz real de líneas de pedido (ajusta campos según tu modelo real)
interface LineaPedido {
  cant: number;
  precio: number;
  // otros campos: idprod, nombre, etc.
}

export class OrderController {

  static async createOrder(req: Request, res: Response) {
    try {
      const userId = req.body.userId;
      const lineasPedido: LineaPedido[] = req.body.lineas || [];

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no especificado'
        });
      }

      if (!lineasPedido || lineasPedido.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El pedido debe contener al menos un producto'
        });
      }

      console.log('📦 Creando pedido para usuario:', userId);
      console.log('📋 Líneas del pedido:', lineasPedido);

      // 1. Crear el pedido en la base de datos
      const pedido = await orderService.createOrder({
        iduser: userId,
        fecha: new Date().toISOString().split('T')[0],
        total: lineasPedido.reduce(
          (acc: number, linea: LineaPedido) => acc + (linea.cant * linea.precio), 0)
      });

      console.log('✅ Pedido creado con ID:', pedido.id);

      // 2. Obtener los datos del usuario
      const usuario = await orderService.getUserData(userId);

      if (!usuario) {
        console.warn('⚠️ No se encontró información del usuario');
      }

      // 3. Generar el PDF del albarán
      const pdfBuffer = await pdfService.generarAlbaranBuffer(pedido, lineasPedido, usuario);

      // 4. Enviar el albarán por email
      let emailEnviado = false;
      if (usuario && usuario.email) {
        try {
          emailEnviado = await emailService.enviarAlbaran(pedido, lineasPedido, usuario, pdfBuffer);
          console.log('✅ Albarán enviado exitosamente por email');
        } catch (emailError) {
          console.error('❌ Error al enviar email:', emailError);
        }
      } else {
        console.warn('⚠️ No se pudo enviar email: usuario sin email configurado');
      }

      return res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: { pedido, emailEnviado }
      });

    } catch (error: any) {
      console.error('❌ Error al crear pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear el pedido',
        error: error.message
      });
    }
  }

  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no especificado'
        });
      }

      console.log('📦 Obteniendo pedidos del usuario:', userId);
      const pedidos = await orderService.getOrdersByUser(parseInt(userId));
      return res.status(200).json({
        success: true,
        data: pedidos
      });
    } catch (error: any) {
      console.error('❌ Error al obtener pedidos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los pedidos',
        error: error.message
      });
    }
  }

  static async descargarAlbaran(req: Request, res: Response) {
    try {
      const pedidoId = parseInt(req.params.pedidoId);
      const userId = req.body.userId || req.query.userId;
      if (!pedidoId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido no especificado'
        });
      }

      console.log('📥 Descargando albarán para pedido:', pedidoId);
      // Obtener datos del pedido
      const pedido = await orderService.getOrderById(pedidoId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Verificar que el pedido pertenece al usuario (opcional)
      if (userId && pedido.iduser !== parseInt(userId as string)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este pedido'
        });
      }

      // Obtener líneas del pedido y datos de usuario
      const lineas = await orderService.getOrderLines(pedidoId);
      const usuario = await orderService.getUserData(pedido.iduser);

      // Generar PDF
      const pdfBuffer = await pdfService.generarAlbaranBuffer(pedido, lineas, usuario);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Albaran_${pedidoId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error: any) {
      console.error('❌ Error al descargar albarán:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar el albarán',
        error: error.message
      });
    }
  }

  static async reenviarAlbaran(req: Request, res: Response) {
    try {
      const pedidoId = parseInt(req.params.pedidoId);
      if (!pedidoId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido no especificado'
        });
      }

      console.log('📧 Reenviando albarán para pedido:', pedidoId);
      const pedido = await orderService.getOrderById(pedidoId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const lineas = await orderService.getOrderLines(pedidoId);
      const usuario = await orderService.getUserData(pedido.iduser);

      if (!usuario || !usuario.email) {
        return res.status(400).json({
          success: false,
          message: 'Usuario sin email configurado'
        });
      }

      // Generar PDF
      const pdfBuffer = await pdfService.generarAlbaranBuffer(pedido, lineas, usuario);

      // Enviar por email
      await emailService.enviarAlbaran(pedido, lineas, usuario, pdfBuffer);

      return res.status(200).json({
        success: true,
        message: 'Albarán enviado exitosamente'
      });
    } catch (error: any) {
      console.error('❌ Error al reenviar albarán:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el albarán',
        error: error.message
      });
    }
  }
}

export default OrderController;

