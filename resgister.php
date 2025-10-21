<?php
// register.php - ARCHIVO COMPLETO PARA TU BACKEND

// ✅ CONFIGURACIÓN CORS (SOLUCIONA EL ERROR)
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Manejar peticiones OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Establecer content type
header('Content-Type: application/json');

try {
    // Verificar que sea POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }
    
    // ✅ OBTENER DATOS DEL FORMULARIO
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
    $direccion = isset($_POST['direccion']) ? trim($_POST['direccion']) : '';
    $ciudad = isset($_POST['ciudad']) ? trim($_POST['ciudad']) : '';
    $cp = isset($_POST['cp']) ? trim($_POST['cp']) : '';
    
    // ✅ VALIDACIONES BÁSICAS
    if (empty($username)) {
        throw new Exception('El campo username es obligatorio');
    }
    if (empty($password)) {
        throw new Exception('El campo password es obligatorio');
    }
    if (empty($email)) {
        throw new Exception('El campo email es obligatorio');
    }
    if (empty($nombre)) {
        throw new Exception('El campo nombre es obligatorio');
    }
    if (empty($cp)) {
        throw new Exception('El campo cp es obligatorio');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email inválido');
    }
    
    if (strlen($password) < 6) {
        throw new Exception('La contraseña debe tener al menos 6 caracteres');
    }
    
    // ✅ CONFIGURACIÓN DE BASE DE DATOS - AJUSTA ESTOS VALORES
    $servername = "localhost";
    $db_username = "root";  // Tu usuario de MySQL
    $db_password = "";      // Tu contraseña de MySQL (vacía en XAMPP por defecto)
    $dbname = "tatoodenda";  // Tu base de datos
    
    // Crear conexión
    $conn = new mysqli($servername, $db_username, $db_password, $dbname);
    
    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    // ✅ VERIFICAR SI EL USUARIO YA EXISTE
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        throw new Exception('El usuario o email ya existe');
    }
    
    // ✅ ENCRIPTAR CONTRASEÑA
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // ✅ INSERTAR NUEVO USUARIO
    $stmt = $conn->prepare("INSERT INTO users (username, password, email, nombre, direccion, ciudad, cp) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $username, $hashed_password, $email, $nombre, $direccion, $ciudad, $cp);
    
    if ($stmt->execute()) {
        // ✅ RESPUESTA DE ÉXITO
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado correctamente',
            'user_id' => $conn->insert_id
        ]);
    } else {
        throw new Exception('Error al registrar usuario: ' . $stmt->error);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    // ✅ RESPUESTA DE ERROR
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>