const { Pool } = require('pg');

const passwordsToTry = ['801313', '', 'postgres', '1234', '123456', 'admin', 'root'];

async function tryConnect(password) {
    const config = {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: password,
        database: 'postgres',
        connectionTimeoutMillis: 1500
    };
    const pool = new Pool(config);
    try {
        await pool.query('SELECT 1');
        await pool.end();
        return true;
    } catch (e) {
        await pool.end();
        return false;
    }
}

async function main() {
    console.log('Detectando contraseña de PostgreSQL...');
    let workingPassword = null;
    
    for (const pwd of passwordsToTry) {
        console.log(`Intentando contraseña: "${pwd}"`);
        const ok = await tryConnect(pwd);
        if (ok) {
            workingPassword = pwd;
            console.log(`✅ ¡Contraseña encontrada!: "${pwd}"`);
            break;
        }
    }
    
    if (workingPassword === null) {
        console.error('❌ No se pudo conectar a PostgreSQL con ninguna de las contraseñas comunes.');
        console.log('👉 Se operará en LocalStorage. Si deseas usar la BD física, actualiza la contraseña en db.js.');
        return;
    }

    const configBase = {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: workingPassword
    };

    try {
        const mainPool = new Pool({ ...configBase, database: 'postgres' });
        await mainPool.query('CREATE DATABASE pc_builder_db').catch(err => {
            if (err.code === '42P04') {
                console.log('La base de datos "pc_builder_db" ya existe.');
            } else {
                console.log('Aviso al intentar crear la BD:', err.message);
            }
        });
        await mainPool.end();

        // Conectar a la base de datos pc_builder_db
        console.log('Conectando a pc_builder_db...');
        const dbPool = new Pool({ ...configBase, database: 'pc_builder_db' });

        // Crear/Actualizar estructura de tablas
        console.log('Configurando tablas y columnas...');
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS ensambles (
                id SERIAL PRIMARY KEY,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE NOT NULL,
                procesador VARCHAR(100) NOT NULL,
                motherboard VARCHAR(100) NOT NULL,
                ram VARCHAR(100) NOT NULL,
                fuente VARCHAR(100) NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);

        // Añadir las nuevas columnas para Almacenamiento, Ventiladores, Monitor y Gráfica si no existen
        await dbPool.query(`
            ALTER TABLE ensambles ADD COLUMN IF NOT EXISTS almacenamiento VARCHAR(100) DEFAULT 'SSD Samsung 980 Pro 1TB NVMe M.2';
            ALTER TABLE ensambles ADD COLUMN IF NOT EXISTS ventiladores VARCHAR(100) DEFAULT 'Ventilador Corsair LL120 RGB 120mm';
            ALTER TABLE ensambles ADD COLUMN IF NOT EXISTS monitor VARCHAR(100) DEFAULT 'Monitor ASUS TUF Gaming 27" 165Hz';
            ALTER TABLE ensambles ADD COLUMN IF NOT EXISTS grafica VARCHAR(100) DEFAULT 'NVIDIA GeForce RTX 4070 Ti Super 16GB';
        `);

        console.log('✅ ¡Base de datos PostgreSQL configurada y migrada correctamente!');
        
        // También actualizaremos db.js con la contraseña correcta para que el servidor pueda conectarse!
        console.log('Actualizando archivo database/db.js con la contraseña correcta...');
        const fs = require('fs');
        const dbJsPath = require('path').join(__dirname, 'database', 'db.js');
        let dbJsContent = fs.readFileSync(dbJsPath, 'utf8');
        dbJsContent = dbJsContent.replace(/password: process\.env\.DB_PASSWORD \|\| '.*'/, `password: process.env.DB_PASSWORD || '${workingPassword}'`);
        fs.writeFileSync(dbJsPath, dbJsContent, 'utf8');
        console.log('✅ database/db.js actualizado.');

        await dbPool.end();
    } catch (error) {
        console.error('❌ Error configurando la base de datos:', error.message);
    }
}

main();
