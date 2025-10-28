import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración del transporter de nodemailer
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_PROVIDER || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Verificar la configuración de email al iniciar
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en la configuración de email:', error);
    console.error('   Verifica las credenciales en el archivo .env');
    console.error('   EMAIL_USER:', process.env.EMAIL_USER);
    console.error('   EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER);
  } else {
    console.log('✅ Servidor de email listo para enviar mensajes');
    console.log('📧 Email configurado:', process.env.EMAIL_USER);
  }
});

export default transporter;

// ====================================
// ARCHIVO: src/services/email.service.ts
// ====================================

// import transporter from '../config/email.config';

export class EmailService {
  /**
   * Envía el albarán del pedido por email
   * @param pedido - Datos del pedido
   * @param lineas - Líneas del pedido con productos
   * @param usuario - Datos del usuario/comprador
   * @param pdfBuffer - Buffer del PDF generado
   * @returns Promise<boolean> - true si se envió correctamente
   */
  async enviarAlbaran(
    pedido: any, 
    lineas: any[], 
    usuario: any, 
    pdfBuffer: Buffer
  ): Promise<boolean> {
    try {
      // Verificar que el usuario tiene email configurado
      if (!usuario || !usuario.email) {
        console.error('❌ El usuario no tiene email configurado');
        return false;
      }

      console.log('📧 Preparando email para:', usuario.email);

      // Calcular el total del pedido (por si no viene en pedido.total)
      const total = pedido.total || lineas.reduce((sum: number, linea: any) => {
        const precio = linea.precio || linea.product?.precio || 0;
        const cantidad = linea.cant || linea.cantidad || 0;
        return sum + (precio * cantidad);
      }, 0);

      // Generar HTML del email con diseño profesional
      const htmlContent = this.generarHTMLEmail(pedido, lineas, usuario, total);

      // Configurar las opciones del email
      const mailOptions = {
        from: `"TatooDenda" <${process.env.EMAIL_USER}>`,
        to: usuario.email,
        subject: `✅ Confirmación de Pedido #${pedido.id} - TatooDenda`,
        html: htmlContent,
        attachments: [
          {
            filename: `Albaran_Pedido_${pedido.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ]
      };

      // Enviar el email
      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Albarán enviado exitosamente');
      console.log('   📧 Destinatario:', usuario.email);
      console.log('   📦 Pedido ID:', pedido.id);
      console.log('   🆔 Message ID:', info.messageId);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error al enviar albarán por email:', error);
      
      // No lanzar el error para que no falle todo el proceso
      // Solo registramos el error y devolvemos false
      return false;
    }
  }

  /**
   * Genera el HTML del email con diseño profesional
   */
  private generarHTMLEmail(
    pedido: any, 
    lineas: any[], 
    usuario: any, 
    total: number
  ): string {
    // Generar las filas de productos para la tabla
    const productosHTML = lineas.map((linea: any) => {
      const nombre = linea.nombre || linea.product?.nombre || 'Producto';
      const color = linea.color || 'N/A';
      const cantidad = linea.cant || linea.cantidad || 0;
      const precio = linea.precio || linea.product?.precio || 0;
      const subtotal = precio * cantidad;
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${nombre}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${cantidad}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">€${precio.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€${subtotal.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Formatear fecha
    const fecha = pedido.fecha ? 
      new Date(pedido.fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }) : 
      new Date().toLocaleDateString('es-ES');

    // Plantilla HTML del email
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Pedido</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- ENCABEZADO -->
          <tr>
            <td style="background-color: #52667a; padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TatooDenda</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Confirmación de Pedido</p>
            </td>
          </tr>

          <!-- SALUDO -->
          <tr>
            <td style="padding: 30px 20px 20px 20px;">
              <h2 style="color: #333; margin: 0 0 15px 0;">¡Hola ${usuario.nombre || 'Cliente'}!</h2>
              <p style="color: #666; line-height: 1.6; margin: 0;">
                Gracias por tu compra. Hemos recibido tu pedido correctamente y lo estamos procesando.
              </p>
            </td>
          </tr>

          <!-- INFORMACIÓN DEL PEDIDO -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <table width="100%" cellpadding="10" style="background-color: #f9f9f9; border-radius: 5px;">
                <tr>
                  <td style="color: #666;"><strong>Número de Pedido:</strong></td>
                  <td style="text-align: right; color: #52667a; font-weight: bold;">#${pedido.id}</td>
                </tr>
                <tr>
                  <td style="color: #666;"><strong>Fecha:</strong></td>
                  <td style="text-align: right; color: #333;">${fecha}</td>
                </tr>
                <tr>
                  <td style="color: #666;"><strong>Total:</strong></td>
                  <td style="text-align: right; color: #52667a; font-weight: bold; font-size: 18px;">€${total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTOS -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Detalle del Pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #52667a; color: white;">
                    <th style="padding: 12px; text-align: left;">Producto</th>
                    <th style="padding: 12px; text-align: center;">Color</th>
                    <th style="padding: 12px; text-align: center;">Cant.</th>
                    <th style="padding: 12px; text-align: right;">Precio</th>
                    <th style="padding: 12px; text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${productosHTML}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- DIRECCIÓN DE ENVÍO -->
          <tr>
            <td style="padding: 0 20px 20px 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0;">Dirección de Envío</h3>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; color: #666; line-height: 1.6;">
                <strong>${usuario.nombre || 'Cliente'}</strong><br>
                ${usuario.direccion || 'Dirección no especificada'}<br>
                ${usuario.ciudad || 'Ciudad'}, ${usuario.cp || 'CP'}
              </div>
            </td>
          </tr>

          <!-- NOTA SOBRE EL PDF -->
          <tr>
            <td style="padding: 0 20px 30px 20px;">
              <div style="background-color: #e8f4f8; border-left: 4px solid #52667a; padding: 15px; border-radius: 3px;">
                <p style="margin: 0; color: #333;">
                  📎 <strong>Albarán adjunto:</strong> Encontrarás el albarán detallado en formato PDF adjunto a este correo.
                </p>
              </div>
            </td>
          </tr>

          <!-- PIE DE PÁGINA -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                Si tienes alguna pregunta, no dudes en contactarnos
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} TatooDenda - Todos los derechos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}