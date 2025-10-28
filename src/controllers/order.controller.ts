import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';

const orderService = new OrderService();
const pdfService = new PdfService();
const emailService = new EmailService();

interface LineaPedido {
  cant: number;
  precio: number;
  nombre?: string;
  idprod: number;
  color: string;
}

export class OrderController {
  /**
   * ✅ MEJORADO: Crear pedido y enviar email automáticamente
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const userId = req.body.userId || req.body.iduser || req.body.usuario_id;
      const lineasPedido = req.body.lineas || [];

      console.log('📦 Datos recibidos en backend:', {
        userId: userId,
        hasUserId: !!userId,
        numLineas: lineasPedido.length
      });

      // Validaciones
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

      // 1. Crear el pedido en la base de datos
      const pedido = await orderService.createOrder({
        iduser: userId,
        fecha: new Date().toISOString().split('T')[0],
        total: lineasPedido.reduce((acc: number, linea: LineaPedido) => 
          acc + (linea.cant * linea.precio), 0
        ),
        lineas: lineasPedido
      });

      console.log('✅ Pedido creado con ID:', pedido.id);

      // 2. Obtener datos del usuario
      const usuario = await orderService.getUserData(userId);
      
      if (!usuario) {
        console.warn('⚠️ No se encontró información del usuario');
      } else {
        console.log('👤 Usuario encontrado:', usuario.email);
      }

      // 3. Generar el PDF del albarán
      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await pdfService.generarAlbaranBuffer(
          pedido,
          lineasPedido,
          usuario
        );
        console.log('📄 PDF generado correctamente');
      } catch (pdfError) {
        console.error('❌ Error al generar PDF:', pdfError);
      }

      // 4. Enviar el albarán por email (NO FALLAR si falla el email)
      let emailEnviado = false;
      if (usuario && usuario.email && pdfBuffer) {
        try {
          console.log('📧 Intentando enviar email a:', usuario.email);
          
          emailEnviado = await emailService.enviarAlbaran(
            pedido,
            lineasPedido,
            usuario,
            pdfBuffer
          );
          
          if (emailEnviado) {
            console.log('✅ Email enviado exitosamente');
          } else {
            console.warn('⚠️ Email no pudo ser enviado, pero el pedido se creó correctamente');
          }
        } catch (emailError) {
          console.error('❌ Error al enviar email:', emailError);
          // No fallamos el pedido si falla el email
        }
      } else {
        console.warn('⚠️ No se puede enviar email:', {
          tieneUsuario: !!usuario,
          tieneEmail: !!(usuario && usuario.email),
          tienePDF: !!pdfBuffer
        });
      }

      // 5. Respuesta exitosa (aunque el email falle)
      return res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: {
          pedido,
          emailEnviado,
          emailStatus: emailEnviado 
            ? 'Email enviado correctamente'
            : 'Pedido creado pero el email no pudo ser enviado'
        }
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

  // ... resto de métodos sin cambios
  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no especificado'
        });
      }

      const pedidos = await orderService.getOrdersByUserWithLines(parseInt(userId));

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

      const pedido = await orderService.getOrderByIdWithLines(pedidoId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      if (userId && pedido.iduser !== parseInt(userId as string)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este pedido'
        });
      }

      const lineas = await orderService.getOrderLines(pedidoId);
      const usuario = await orderService.getUserData(pedido.iduser);
      
      const pdfBuffer = await pdfService.generarAlbaranBuffer(
        pedido,
        lineas,
        usuario
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Albaran_${pedidoId}.pdf"`
      );

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

      const pedido = await orderService.getOrderByIdWithLines(pedidoId);
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

      const pdfBuffer = await pdfService.generarAlbaranBuffer(
        pedido,
        lineas,
        usuario
      );

      const emailEnviado = await emailService.enviarAlbaran(
        pedido, 
        lineas, 
        usuario, 
        pdfBuffer
      );

      return res.status(200).json({
        success: true,
        message: emailEnviado 
          ? 'Albarán enviado exitosamente'
          : 'No se pudo enviar el albarán'
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