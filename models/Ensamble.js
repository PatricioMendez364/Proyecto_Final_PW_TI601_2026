/**
 * Modelo de Ensamble orientado a objetos (Práctica 4.5)
 * Representa el presupuesto de una PC con validaciones y encapsulamiento.
 */

class Ensamble {
    // Propiedades privadas
    #id;
    #usuarioId;
    #procesador;
    #motherboard;
    #ram;
    #fuente;
    #almacenamiento;
    #ventiladores;
    #monitor;
    #grafica;
    #fecha;

    constructor(id, usuarioId, procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica, fecha = new Date().toISOString()) {
        this.#id = id;
        this.usuarioId = usuarioId;
        this.procesador = procesador;
        this.motherboard = motherboard;
        this.ram = ram;
        this.fuente = fuente;
        this.almacenamiento = almacenamiento;
        this.ventiladores = ventiladores;
        this.monitor = monitor;
        this.grafica = grafica;
        this.#fecha = fecha;
    }

    // Getters
    get id() { return this.#id; }
    get usuarioId() { return this.#usuarioId; }
    get procesador() { return this.#procesador; }
    get motherboard() { return this.#motherboard; }
    get ram() { return this.#ram; }
    get fuente() { return this.#fuente; }
    get almacenamiento() { return this.#almacenamiento; }
    get ventiladores() { return this.#ventiladores; }
    get monitor() { return this.#monitor; }
    get grafica() { return this.#grafica; }
    get fecha() { return this.#fecha; }

    // Setters con validaciones
    set usuarioId(val) {
        const idNum = parseInt(val);
        if (isNaN(idNum) || idNum <= 0) {
            throw new Error('ID de usuario inválida.');
        }
        this.#usuarioId = idNum;
    }

    set procesador(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('El procesador es obligatorio.');
        }
        this.#procesador = val.trim();
    }

    set motherboard(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('La tarjeta madre (motherboard) es obligatoria.');
        }
        this.#motherboard = val.trim();
    }

    set ram(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('La memoria RAM es obligatoria.');
        }
        this.#ram = val.trim();
    }

    set fuente(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('La fuente de poder es obligatoria.');
        }
        this.#fuente = val.trim();
    }

    set almacenamiento(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('El almacenamiento es obligatorio.');
        }
        this.#almacenamiento = val.trim();
    }

    set ventiladores(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('Los ventiladores son obligatorios.');
        }
        this.#ventiladores = val.trim();
    }

    set monitor(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('El monitor es obligatorio.');
        }
        this.#monitor = val.trim();
    }

    set grafica(val) {
        if (!val || typeof val !== 'string' || val.trim() === '') {
            throw new Error('La tarjeta gráfica es obligatoria.');
        }
        this.#grafica = val.trim();
    }

    set fecha(val) {
        this.#fecha = val;
    }

    // Método para exportar a un objeto plano legible
    toJSON() {
        return {
            id: this.#id,
            usuarioId: this.#usuarioId,
            procesador: this.#procesador,
            motherboard: this.#motherboard,
            ram: this.#ram,
            fuente: this.#fuente,
            almacenamiento: this.#almacenamiento,
            ventiladores: this.#ventiladores,
            monitor: this.#monitor,
            grafica: this.#grafica,
            fecha: this.#fecha
        };
    }
}

// Conexión a base de datos física (Práctica 4.6)
const db = require('../database/db');

// Métodos estáticos de almacenamiento y búsqueda vinculados a PostgreSQL
Ensamble.crear = async function ({ usuarioId, procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica }) {
    // Instanciar un ensamble temporal para ejecutar setters y realizar validaciones de tipo
    const tempEnsamble = new Ensamble(999, usuarioId, procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica);

    const query = 'INSERT INTO ensambles (usuario_id, procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
    const values = [
        tempEnsamble.usuarioId,
        tempEnsamble.procesador,
        tempEnsamble.motherboard,
        tempEnsamble.ram,
        tempEnsamble.fuente,
        tempEnsamble.almacenamiento,
        tempEnsamble.ventiladores,
        tempEnsamble.monitor,
        tempEnsamble.grafica
    ];

    const res = await db.query(query, values);
    const row = res.rows[0];

    return new Ensamble(
        row.id,
        row.usuario_id,
        row.procesador,
        row.motherboard,
        row.ram,
        row.fuente,
        row.almacenamiento,
        row.ventiladores,
        row.monitor,
        row.grafica,
        row.fecha
    );
};

Ensamble.obtenerPorUsuario = async function (usuarioId) {
    const idNum = parseInt(usuarioId);
    if (isNaN(idNum)) return [];

    const query = 'SELECT * FROM ensambles WHERE usuario_id = $1 ORDER BY fecha DESC';
    const res = await db.query(query, [idNum]);

    return res.rows.map(row => new Ensamble(
        row.id,
        row.usuario_id,
        row.procesador,
        row.motherboard,
        row.ram,
        row.fuente,
        row.almacenamiento,
        row.ventiladores,
        row.monitor,
        row.grafica,
        row.fecha
    ));
};

Ensamble.actualizar = async function (id, usuarioId, { procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica }) {
    const idNum = parseInt(id);
    const userIdNum = parseInt(usuarioId);
    if (isNaN(idNum) || isNaN(userIdNum)) return null;

    // Instanciar ensamble temporal para aplicar validaciones de los setters
    const tempEnsamble = new Ensamble(idNum, userIdNum, procesador, motherboard, ram, fuente, almacenamiento, ventiladores, monitor, grafica);

    const query = 'UPDATE ensambles SET procesador = $1, motherboard = $2, ram = $3, fuente = $4, almacenamiento = $5, ventiladores = $6, monitor = $7, grafica = $8, fecha = NOW() WHERE id = $9 AND usuario_id = $10 RETURNING *';
    const values = [
        tempEnsamble.procesador,
        tempEnsamble.motherboard,
        tempEnsamble.ram,
        tempEnsamble.fuente,
        tempEnsamble.almacenamiento,
        tempEnsamble.ventiladores,
        tempEnsamble.monitor,
        tempEnsamble.grafica,
        idNum,
        userIdNum
    ];

    const res = await db.query(query, values);
    if (res.rows.length === 0) {
        return null; // Ensamble no encontrado o no autorizado
    }

    const row = res.rows[0];
    return new Ensamble(
        row.id,
        row.usuario_id,
        row.procesador,
        row.motherboard,
        row.ram,
        row.fuente,
        row.almacenamiento,
        row.ventiladores,
        row.monitor,
        row.grafica,
        row.fecha
    );
};

Ensamble.eliminar = async function (id, usuarioId) {
    const idNum = parseInt(id);
    const userIdNum = parseInt(usuarioId);
    if (isNaN(idNum) || isNaN(userIdNum)) return false;

    const query = 'DELETE FROM ensambles WHERE id = $1 AND usuario_id = $2';
    const res = await db.query(query, [idNum, userIdNum]);

    return res.rowCount > 0;
};

module.exports = Ensamble;
