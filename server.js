const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());

// Habilitar CORS para permitir peticiones desde cualquier origen (incluyendo archivos HTML locales)
app.use(cors());

// Servir archivos estáticos del simulador y diseños 3D
app.use(express.static(__dirname));

// IMPORTAR MODELOS ORIENTADOS A OBJETOS (Práctica 4.5)
const Usuario = require('./models/Usuario');
const Ensamble = require('./models/Ensamble');

// Helper para tokens (por protocolo sin dependencias extra)
function generateToken(userId) {
    return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 3600000 })).toString('base64');
}

function validateAndGetUserId(token) {
    try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
        if (payload.exp > Date.now()) return payload.userId;
    } catch { return null; }
}

// Endpoint de estado para verificación del cliente
app.get('/api/status', (req, res) => {
    return res.json({ status: 'online' });
});

// 1. Registro
app.post('/api/registro', async (req, res) => {
    const { nombre, email, password } = req.body;

    // 1.1 Validar campos vacíos
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        // La validación interna se realiza en la inicialización (setters) de Usuario
        const usuario = await Usuario.crear({ nombre, email, password });
        console.log('[Registro]', { id: usuario.id, nombre: usuario.nombre, email: usuario.email });

        const token = generateToken(usuario.id);
        return res.status(201).json({
            mensaje: '¡Cuenta creada! Bienvenido, ' + usuario.nombre + '!',
            usuario: usuario.getPublicData(),
            token
        });
    } catch (error) {
        // Captura cualquier error de validación de los setters (ej. correo inválido, password corta)
        return res.status(400).json({ error: error.message });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        const usuario = await Usuario.buscarPorEmail(email);
        if (!usuario || !usuario.validarPassword(password)) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        console.log('[Login]', { id: usuario.id, nombre: usuario.nombre });
        const token = generateToken(usuario.id);
        return res.status(200).json({
            mensaje: '¡Sesión iniciada! Hola, ' + usuario.nombre + '!',
            usuario: usuario.getPublicData(),
            token
        });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al procesar el inicio de sesión.' });
    }
});

// Middleware verificar token
async function authRequired(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Inicia sesión primero.' });
    }

    const userId = validateAndGetUserId(token);
    if (!userId) {
        return res.status(401).json({ error: 'Token inválido o sesión expirada.' });
    }

    try {
        const usuario = await Usuario.buscarPorId(userId);
        if (!usuario) {
            return res.status(401).json({ error: 'Token inválido o sesión expirada.' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Error interno en la autenticación.' });
    }
}

// 3. Guardar ensamble
app.post('/api/ensamble', authRequired, async (req, res) => {
    const { procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica } = req.body;

    try {
        const ensamble = await Ensamble.crear({
            usuarioId: req.usuario.id,
            procesador,
            motherboard,
            ram,
            fuente,
            almacenamiento,
            ventiladores,
            monitor,
            grafica
        });

        console.log('[Ensamble guardado]', {
            usuarioId: req.usuario.id,
            procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica
        });

        return res.status(201).json({
            mensaje: '¡Lista de deseos guardada! CPU: ' + procesador + ' vinculada a tu cuenta.',
            ensamble: ensamble.toJSON()
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

// 4. Obtener ensambles del usuario
app.get('/api/ensamble', authRequired, async (req, res) => {
    try {
        const listaInstancias = await Ensamble.obtenerPorUsuario(req.usuario.id);
        const lista = listaInstancias.map(e => e.toJSON());
        return res.status(200).json({ ensambles: lista });
    } catch (error) {
        return res.status(500).json({ error: 'Error al obtener tus ensambles.' });
    }
});

// 5. Actualizar ensamble del usuario (Operación UPDATE en el CRUD)
app.put('/api/ensamble/:id', authRequired, async (req, res) => {
    const id = parseInt(req.params.id);
    const { procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica } = req.body;

    try {
        const ensamble = await Ensamble.actualizar(id, req.usuario.id, {
            procesador,
            motherboard,
            ram,
            fuente,
            almacenamiento,
            ventiladores,
            monitor,
            grafica
        });

        if (!ensamble) {
            return res.status(404).json({ error: 'Ensamble no encontrado o no autorizado.' });
        }

        console.log('[Ensamble actualizado]', { id, usuarioId: req.usuario.id });
        return res.status(200).json({
            mensaje: '¡Ensamble actualizado con éxito!',
            ensamble: ensamble.toJSON()
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

// 6. Eliminar ensamble del usuario
app.delete('/api/ensamble/:id', authRequired, async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const exito = await Ensamble.eliminar(id, req.usuario.id);
        if (!exito) {
            return res.status(404).json({ error: 'Ensamble no encontrado o no autorizado.' });
        }

        console.log('[Ensamble eliminado]', { id, usuarioId: req.usuario.id });
        return res.status(200).json({ mensaje: '¡Ensamble eliminado con éxito!' });
    } catch (error) {
        return res.status(500).json({ error: 'Error interno al eliminar el ensamble.' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Servidor corriendo en http://localhost:' + PORT);
    console.log('Endpoints disponibles (Conexión de Clases POO activa):');
    console.log('  POST /api/registro');
    console.log('  POST /api/login');
    console.log('  POST /api/ensamble (requiere Bearer Token)');
    console.log('  GET /api/ensamble (requiere Bearer Token)');
    console.log('  PUT /api/ensamble/:id (requiere Bearer Token)');
    console.log('  DELETE /api/ensamble/:id (requiere Bearer Token)');
});