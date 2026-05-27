-- SCRIPT DE DEFINICIÓN DE BASE DE DATOS (PostgreSQL)
-- Práctica 4.6: Acceso a Datos

-- 1. Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de ensambles (presupuestos de PC)
CREATE TABLE IF NOT EXISTS ensambles (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
    procesador VARCHAR(100) NOT NULL,
    motherboard VARCHAR(100) NOT NULL,
    ram VARCHAR(100) NOT NULL,
    fuente VARCHAR(100) NOT NULL,
    almacenamiento VARCHAR(100) DEFAULT 'SSD Samsung 980 Pro 1TB NVMe M.2' NOT NULL,
    ventiladores VARCHAR(100) DEFAULT 'Ventilador Corsair LL120 RGB 120mm' NOT NULL,
    monitor VARCHAR(100) DEFAULT 'Monitor ASUS TUF Gaming 27" 165Hz' NOT NULL,
    grafica VARCHAR(100) DEFAULT 'NVIDIA GeForce RTX 4070 Ti Super 16GB' NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
