const { Pool } = require('pg');

// Configuración del Pool de Conexiones para PostgreSQL
// Utiliza variables de entorno si están presentes, o valores estándar de desarrollo local.
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '801313', // Ajusta si usas otra contraseña local
    database: process.env.DB_DATABASE || 'pc_builder_db'
});

// Comprobación de conexión inicial silenciosa / no-bloqueante
pool.query('SELECT NOW()')
    .then(() => {
        console.log('✅ Conexión exitosa a la base de datos PostgreSQL.');
    })
    .catch(err => {
        console.warn('\n⚠️  [PostgreSQL] Advertencia de Conexión:');
        console.warn('   No se pudo conectar a la base de datos local "pc_builder_db".');
        console.warn('   Detalle del error:', err.message);
        console.warn('   👉 Para habilitar la persistencia física, asegúrate de:');
        console.warn('      1. Tener PostgreSQL activo en el puerto 5432.');
        console.warn('      2. Crear la base de datos "pc_builder_db".');
        console.warn('      3. Ejecutar las tablas del archivo "database/schema.sql" en ella.');
        console.warn('   💡 NOTA: El servidor seguirá funcionando; si la base de datos no está disponible,');
        console.warn('      puedes usar el respaldo de LocalStorage para tus pruebas locales.\n');
    });

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
