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