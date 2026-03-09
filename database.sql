-- ============================================================
-- PORTAL DEL SOL — Script SQL para MySQL / PlanetScale
-- ============================================================

CREATE DATABASE IF NOT EXISTS inmobiliaria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inmobiliaria_db;

CREATE TABLE IF NOT EXISTS usuarios (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    email             VARCHAR(150) UNIQUE NOT NULL,
    cedula            VARCHAR(20),
    telefono          VARCHAR(20),
    password          VARCHAR(255) NOT NULL,
    rol               ENUM('admin','cliente') NOT NULL DEFAULT 'cliente',
    email_verificado  TINYINT(1) DEFAULT 0,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reset_tokens (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNIQUE,
    token       VARCHAR(255) NOT NULL,
    expira_en   DATETIME NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proyectos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ubicacion   VARCHAR(300),
    area_total  DECIMAL(12,2),
    imagen_url  VARCHAR(300),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS etapas (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id  INT,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    orden        INT DEFAULT 1,
    estado       ENUM('activa','completada','pendiente') DEFAULT 'activa',
    fecha_inicio DATE,
    fecha_fin    DATE,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lotes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    etapa_id    INT,
    codigo      VARCHAR(50) UNIQUE NOT NULL,
    area_m2     DECIMAL(8,2) NOT NULL,
    precio      DECIMAL(15,2) NOT NULL,
    ubicacion   VARCHAR(200),
    descripcion TEXT,
    estado      ENUM('disponible','reservado','vendido') DEFAULT 'disponible',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (etapa_id) REFERENCES etapas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS compras (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT,
    lote_id          INT,
    cuotas_acordadas INT DEFAULT 12,
    fecha_inicio     DATE,
    notas            TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (lote_id)    REFERENCES lotes(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pagos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    compra_id        INT,
    monto            DECIMAL(15,2) NOT NULL,
    tipo_pago        VARCHAR(50) DEFAULT 'transferencia',
    comprobante_url  VARCHAR(300),
    notas            TEXT,
    estado           ENUM('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
    fecha_pago       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pqrs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT,
    tipo             ENUM('peticion','queja','reclamo','sugerencia') NOT NULL,
    asunto           VARCHAR(200) NOT NULL,
    descripcion      TEXT NOT NULL,
    estado           ENUM('pendiente','en_proceso','respondida','cerrada') DEFAULT 'pendiente',
    respuesta        TEXT,
    fecha_respuesta  DATETIME,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin por defecto (password: Admin2024*)
INSERT IGNORE INTO usuarios (nombre, apellido, email, password, rol, email_verificado)
VALUES ('Administrador', 'Sistema', 'admin@inmobiliaria.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NnHALFnvS',
        'admin', 1);
