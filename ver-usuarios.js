const db = require('./database/db');

async function verUsuarios() {
    try {
        const res = await db.query('SELECT id, nombre, email, password FROM usuarios ORDER BY id;');
        console.log('\n======================================================');
        console.log('         TABLA DE USUARIOS (POSTGRESQL)               ');
        console.log('======================================================');
        if (res.rows.length === 0) {
            console.log('No hay usuarios registrados en la base de datos.');
        } else {
            console.table(res.rows);
        }
        console.log('======================================================\n');
    } catch (err) {
        console.error('❌ Error al consultar la base de datos PostgreSQL:', err.message);
    } finally {
        db.pool.end();
    }
}

verUsuarios();
