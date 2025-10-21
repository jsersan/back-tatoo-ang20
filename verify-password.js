// verify-password.js - Ejecutar con: node verify-password.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function verifyPassword() {
  console.log('=== VERIFICACIÓN DE CONTRASEÑAS ===');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    // Buscar el usuario jsersan
    const [users] = await connection.execute(
      "SELECT id, username, password FROM user WHERE username = 'jsersan'"
    );

    if (users.length === 0) {
      console.log('❌ Usuario "jsersan" no encontrado');
      return;
    }

    const user = users[0];
    console.log('\n👤 Usuario encontrado:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Password hash:', user.password);
    console.log('Longitud del hash:', user.password ? user.password.length : 'NO HAY PASSWORD');

    // Verificar si es un hash de bcrypt válido
    const isBcryptHash = user.password && user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    console.log('\n🔐 ¿Es un hash de bcrypt válido?', isBcryptHash);

    if (!isBcryptHash) {
      console.log('⚠️  La contraseña NO está hasheada con bcrypt');
      console.log('💡 Solución: Necesitas hashear la contraseña');
      
      // Generar hash para contraseñas comunes
      const commonPasswords = ['admin123', 'password', '123456', 'admin', 'jsersan'];
      console.log('\n🔧 Hashes para contraseñas comunes:');
      
      for (const pwd of commonPasswords) {
        const hash = bcrypt.hashSync(pwd, 10);
        console.log(`${pwd} → ${hash}`);
      }
    } else {
      // Probar contraseñas comunes
      const testPasswords = ['admin123', 'password', '123456', 'admin', 'jsersan', '***'];
      console.log('\n🧪 Probando contraseñas comunes:');
      
      for (const testPwd of testPasswords) {
        const isValid = bcrypt.compareSync(testPwd, user.password);
        console.log(`"${testPwd}" → ${isValid ? '✅ VÁLIDA' : '❌ incorrecta'}`);
        
        if (isValid) {
          console.log(`🎉 ¡Contraseña correcta encontrada: "${testPwd}"`);
        }
      }
    }

    await connection.end();
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

verifyPassword();