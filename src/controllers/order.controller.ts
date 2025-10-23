import { Request, Response } from 'express'

import { OrderService } from '../services/order.service'
import { PdfService } from '../services/pdf.service'
import { EmailService } from '../services/email.service'

const orderService = new OrderService()
const pdfService = new PdfService()
const emailService = new EmailService()

// Define tu interfaz real de lÃ­neas de pedido (ajusta campos segÃºn tu modelo real)
interface LineaPedido {
  cant: number
  precio: number
  // otros campos: idprod, nombre, etc.
}

export class OrderController {
  static async createOrder (req: Request, res: Response) {
    try {
      const userId = req.body.userId || req.body.iduser || req.body.usuario_id
      const lineasPedido = req.body.lineas || []

      // âœ… AÃ‘ADIR LOG para debugging:
      console.log('ðŸ“¦ Datos recibidos en backend:', {
        body: req.body,
        userId: userId,
        hasUserId: !!userId
      })

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no especificado'
        })
      }

      if (!lineasPedido || lineasPedido.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El pedido debe contener al menos un producto'
        })
      }

      console.log('ðŸ“¦ Creando pedido para usuario:', userId)
      console.log('ðŸ“‹ LÃ­neas del pedido:', lineasPedido)

      // 1. Crear el pedido en la base de datos
      const pedido = await orderService.createOrder({
        iduser: userId,
        fecha: new Date().toISOString().split('T')[0],
        total: lineasPedido.reduce((acc: number, linea: LineaPedido) => acc + linea.cant * linea.precio, 0),
        lineas: lineasPedido
      });

      console.log('âœ… Pedido creado con ID:', pedido.id)

      // 2. Obtener los datos del usuario
      const usuario = await orderService.getUserData(userId)
      if (!usuario) {
        console.warn('âš ï¸ No se encontró información del usuario')
      }

      // 3. Generar el PDF del albarÃ¡n
      const pdfBuffer = await pdfService.generarAlbaranBuffer(
        pedido,
        lineasPedido,
        usuario
      )

      // 4. Enviar el albarÃ¡n por email
      let emailEnviado = false
      if (usuario && usuario.email) {
        try {
          emailEnviado = await emailService.enviarAlbaran(
            pedido,
            lineasPedido,
            usuario,
            pdfBuffer
          )
          console.log('âœ… AlbarÃ¡n enviado exitosamente por email')
        } catch (emailError) {
          console.error('âŒ Error al enviar email:', emailError)
        }
      } else {
        console.warn(
          'âš ï¸ No se pudo enviar email: usuario sin email configurado'
        )
      }

      return res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: { pedido, emailEnviado }
      })
    } catch (error: any) {
      console.error('âŒ Error al crear pedido:', error)
      return res.status(500).json({
        success: false,
        message: 'Error al crear el pedido',
        error: error.message
      })
    }
  }

  static async getUserOrders (req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.body.userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Usuario no especificado'
        })
      }

      console.log('ðŸ“¦ Obteniendo pedidos del usuario:', userId)
      const pedidos = await orderService.getOrdersByUserWithLines(parseInt(userId));


      return res.status(200).json({
        success: true,
        data: pedidos
      })
    } catch (error: any) {
      console.error('âŒ Error al obtener pedidos:', error)
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los pedidos',
        error: error.message
      })
    }
  }

  static async descargarAlbaran (req: Request, res: Response) {
    try {
      const pedidoId = parseInt(req.params.pedidoId)
      const userId = req.body.userId || req.query.userId
      if (!pedidoId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido no especificado'
        })
      }

      console.log('ðŸ“¥ Descargando albarÃ¡n para pedido:', pedidoId)
      // Obtener datos del pedido
      const pedido = await orderService.getOrderByIdWithLines(pedidoId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        })
      }

      // Verificar que el pedido pertenece al usuario (opcional)
      if (userId && pedido.iduser !== parseInt(userId as string)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este pedido'
        })
      }

      // Obtener lÃ­neas del pedido y datos de usuario
      const lineas = await orderService.getOrderLines(pedidoId)
      const usuario = await orderService.getUserData(pedido.iduser)
      // Generar PDF
      const pdfBuffer = await pdfService.generarAlbaranBuffer(
        pedido,
        lineas,
        usuario
      )

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="Albaran_${pedidoId}.pdf"`
      )

      res.send(pdfBuffer)
    } catch (error: any) {
      console.error('âŒ Error al descargar albarÃ¡n:', error)
      return res.status(500).json({
        success: false,
        message: 'Error al generar el albarÃ¡n',
        error: error.message
      })
    }
  }

  static async reenviarAlbaran (req: Request, res: Response) {
    try {
      const pedidoId = parseInt(req.params.pedidoId)
      if (!pedidoId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido no especificado'
        })
      }

      console.log('ðŸ“§ Reenviando albarÃ¡n para pedido:', pedidoId)
      const pedido = await orderService.getOrderByIdWithLines(pedidoId);
      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        })
      }

      const lineas = await orderService.getOrderLines(pedidoId)
      const usuario = await orderService.getUserData(pedido.iduser)
      if (!usuario || !usuario.email) {
        return res.status(400).json({
          success: false,
          message: 'Usuario sin email configurado'
        })
      }

      // Generar PDF
      const pdfBuffer = await pdfService.generarAlbaranBuffer(
        pedido,
        lineas,
        usuario
      )

      // Enviar por email
      await emailService.enviarAlbaran(pedido, lineas, usuario, pdfBuffer)

      return res.status(200).json({
        success: true,
        message: 'AlbarÃ¡n enviado exitosamente'
      })
    } catch (error: any) {
      console.error('âŒ Error al reenviar albarÃ¡n:', error)
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el albarÃ¡n',
        error: error.message
      })
    }
  }
}

export default OrderController


