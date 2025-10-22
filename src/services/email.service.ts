import transporter from '../config/email.config'; // Ajusta la ruta a tu configuración SMTP/Ethereal/Sendgrid, etc.

export class EmailService {
  async enviarAlbaran(pedido: any, lineas: any[], usuario: any, pdfBuffer: Buffer): Promise<boolean> {
    try {
      if (!usuario.email) {
        console.error('El usuario no tiene email configurado');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: usuario.email,
        subject: `Albarán Pedido ${pedido.id} - TatooDenda`,
        html: `<p>Estimado/a ${usuario.nombre}, adjuntamos el albarán del pedido ${pedido.id}.</p>`,
        attachments: [
          {
            filename: `AlbaranPedido${pedido.id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ]
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Albarán enviado a ${usuario.email} - Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error al enviar albarán', error);
      throw error;
    }
  }
}
