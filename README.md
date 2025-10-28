# TatooDenda Backend

Backend para la tienda online de tatuajes y piercings TatooDenda, desarrollado con Node.js, Express y TypeScript.

## 📋 Descripción

Este proyecto implementa una API RESTful para gestionar una tienda en línea especializada en tatuajes, piercings y accesorios. El backend proporciona endpoints para la gestión de usuarios, productos, categorías y pedidos, con autenticación JWT y roles de usuario.

## 🚀 Tecnologías

- **Node.js**: Entorno de ejecución
- **Express**: Framework web
- **TypeScript**: Lenguaje de programación tipado
- **Sequelize**: ORM para base de datos
- **MySQL**: Base de datos relacional
- **JWT**: Autenticación basada en tokens
- **Multer**: Manejo de subida de archivos
- **Jest**: Framework de pruebas

## ⚙️ Requisitos previos

- Node.js (v16 o superior)
- MySQL (v8 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/usuario/tatoodenda-backend.git
cd tatoodenda-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.development` a `.env`:

```bash
cp src/config/.env.development .env
```

Edita el archivo `.env` con tu configuración:

```
# Puerto del servidor
PORT=3000

# Configuración de base de datos
DB_HOST=localhost
DB_USER=tuusuario
DB_PASS=tupassword
DB_NAME=tatoodenda_db

# Secreto para JWT (cámbialo por uno seguro)
JWT_SECRET=tu_clave_secreta_segura
JWT_EXPIRES_IN=24h
```

4. **Inicializar la base de datos**

```bash
# Crear la base de datos y tablas iniciales
node src/scripts/db-init.js
```

5. **Compilar el código TypeScript**

```bash
npm run build
```

## ▶️ Ejecución

### Modo desarrollo (con reinicio automático)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

## 🧪 Pruebas

Ejecutar las pruebas unitarias:

```bash
npm test
```

## 📁 Estructura del proyecto

```
tatoodenda-backend/
├── dist/               # Código compilado
├── src/                # Código fuente
│   ├── config/         # Configuración
│   ├── controllers/    # Controladores
│   ├── interfaces/     # Interfaces TypeScript
│   ├── middleware/     # Middleware
│   ├── models/         # Modelos de datos
│   ├── routes/         # Rutas de la API
│   ├── scripts/        # Scripts de utilidad
│   ├── utils/          # Utilidades
│   └── server.ts       # Punto de entrada
├── uploads/            # Carpeta para archivos subidos
├── .env                # Variables de entorno
├── package.json        # Dependencias y scripts
└── tsconfig.json       # Configuración de TypeScript
```

## 🔗 Endpoints principales

La API define las siguientes rutas principales:

- **Autenticación**: `/api/users/register`, `/api/users/login`
- **Usuarios**: `/api/users/profile`, `/api/users/:id`
- **Categorías**: `/api/categorias`
- **Productos**: `/api/productos`
- **Pedidos**: `/api/pedidos`

Para una documentación completa de la API, consulta el archivo `src/utils/openapi.yaml`.

## 👥 Roles de usuario

- **Usuario**: Puede registrarse, iniciar sesión, ver productos y realizar pedidos
- **Administrador**: Tiene todos los permisos de usuario y además puede gestionar productos, categorías y ver todos los pedidos

## 🛠️ Scripts disponibles

- `npm run build`: Compila el código TypeScript
- `npm start`: Inicia la aplicación en modo producción
- `npm run dev`: Inicia la aplicación en modo desarrollo con reinicio automático
- `npm run lint`: Verifica el código con ESLint
- `npm test`: Ejecuta pruebas unitarias

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Consulta el archivo LICENSE para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o una pull request para sugerir cambios o mejoras.

1. Fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request
# tatoodenda-backend
# tatooback
# backend-tatoo
# tatoodenda-back
# tatoodenda-backend
# 40-tatoodenda-arsys-backend
# backend-ecommerce
# backend-ultimo
# backend-ultimo
# backend-ultimo
