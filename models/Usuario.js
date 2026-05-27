/**
 * Modelo de Usuario orientado a objetos (Práctica 4.5)
 * Implementa encapsulamiento y validación con propiedades privadas nativas de ES6 (#).
 */

class Usuario {
    // Propiedades privadas
    #id;
    #nombre;
    #email;
    #password;

    constructor(id, nombre, email, password) {
        this.#id = id;
        this.nombre = nombre; // Usa el setter para validar
        this.email = email;   // Usa el setter para validar
        this.password = password; // Usa el setter para validar
    }

    // Getters
    get id() {
        return this.#id;
    }

    get nombre() {
        return this.#nombre;
    }

    get email() {
        return this.#email;
    }

    // Exponer getter de password para permitir la persistencia en base de datos
    get password() {
        return this.#password;
    }

    // Setters con validaciones internas
    set nombre(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('El nombre no puede estar vacío.');
        }
        this.#nombre = val.trim();
    }

    set email(val) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val || !emailRegex.test(val)) {
            throw new Error('Formato de correo inválido.');
        }
        this.#email = val.toLowerCase().trim();
    }

    set password(val) {
        if (!val || val.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        this.#password = val;
    }

    // Métodos de instancia
    getPublicData() {
        return {
            id: this.#id,
            nombre: this.#nombre,
            email: this.#email
        };
    }

    validarPassword(pwd) {
        return this.#password === pwd;
    }
}

// Conexión a base de datos física (Práctica 4.6)
const db = require('../database/db');

// Métodos estáticos de almacenamiento y búsqueda vinculados a PostgreSQL
Usuario.crear = async function ({ nombre, email, password }) {
    const emailNormalizado = email.toLowerCase().trim();

    // Instanciar un usuario temporal solo para ejecutar sus setters y validar los datos
    const tempUser = new Usuario(999, nombre, emailNormalizado, password);

    const query = 'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING *';
    const values = [tempUser.nombre, tempUser.email, tempUser.password];

    try {
        const res = await db.query(query, values);
        const row = res.rows[0];
        return new Usuario(row.id, row.nombre, row.email, row.password);
    } catch (error) {
        if (error.code === '23505') { // Violación de restricción UNIQUE en PostgreSQL (email duplicado)
            throw new Error('Ya existe una cuenta con ese correo.');
        }
        throw error;
    }
};

Usuario.buscarPorEmail = async function (email) {
    if (!email) return null;
    const emailNormalizado = email.toLowerCase().trim();

    const query = 'SELECT * FROM usuarios WHERE LOWER(email) = $1';
    const res = await db.query(query, [emailNormalizado]);

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return new Usuario(row.id, row.nombre, row.email, row.password);
};

Usuario.buscarPorId = async function (id) {
    const idNum = parseInt(id);
    if (isNaN(idNum)) return null;

    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const res = await db.query(query, [idNum]);

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return new Usuario(row.id, row.nombre, row.email, row.password);
};

module.exports = Usuario;
