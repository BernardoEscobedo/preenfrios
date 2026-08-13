import { db } from "../database/connection.database.js";


// Obtener todas las ocupaciones
const getOcupaciones = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM ocupaciones_camaras
        ORDER BY id_ocupacion ASC
        `
    );

    return result.rows;
};


// Obtener una ocupación por ID
const getOcupacionById = async (id_ocupacion) => {

    const result = await db.query(
        `
        SELECT *
        FROM ocupaciones_camaras
        WHERE id_ocupacion = $1
        `,
        [id_ocupacion]
    );

    return result.rows[0];
};


// Obtener ocupaciones por cámara
const getOcupacionesByCamara = async (id_camara) => {

    const result = await db.query(
        `
        SELECT *
        FROM ocupaciones_camaras
        WHERE id_camara = $1
        ORDER BY fecha_inicio DESC, hora_inicio DESC
        `,
        [id_camara]
    );

    return result.rows;
};


// Obtener ocupaciones activas (estado = 1)
const getOcupacionesActivas = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM ocupaciones_camaras
        WHERE estado = 1
        ORDER BY fecha_inicio DESC, hora_inicio DESC
        `
    );

    return result.rows;
};


// Crear ocupación
const createOcupacion = async ({
    id_camara,
    fecha_inicio,
    hora_inicio,
    fecha_fin,
    hora_fin,
    cantidad_tarimas,
    cantidad_cajas,
    cantidad_bloques,
    tipo_ocupacion,
    id_mantenimiento,
    estado,
    observaciones
}) => {

    const result = await db.query(
        `
        INSERT INTO ocupaciones_camaras (
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas,
            cantidad_cajas,
            cantidad_bloques,
            tipo_ocupacion,
            id_mantenimiento,
            estado,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            cantidad_bloques ?? 0,
            tipo_ocupacion ?? 1,
            id_mantenimiento,
            estado,
            observaciones
        ]
    );

    return result.rows[0];
};


// Actualizar ocupación
const updateOcupacion = async (
    id_ocupacion,
    {
        id_camara,
        fecha_inicio,
        hora_inicio,
        fecha_fin,
        hora_fin,
        cantidad_tarimas,
        cantidad_cajas,
        cantidad_bloques,
        tipo_ocupacion,
        id_mantenimiento,
        estado,
        observaciones
    }
) => {

    const result = await db.query(
        `
        UPDATE ocupaciones_camaras
        SET
            id_camara = $1,
            fecha_inicio = $2,
            hora_inicio = $3,
            fecha_fin = $4,
            hora_fin = $5,
            cantidad_tarimas = $6,
            cantidad_cajas = $7,
            cantidad_bloques = $8,
            tipo_ocupacion = $9,
            id_mantenimiento = $10,
            estado = $11,
            observaciones = $12
        WHERE id_ocupacion = $13
        RETURNING *
        `,
        [
            id_camara,
            fecha_inicio,
            hora_inicio,
            fecha_fin,
            hora_fin,
            cantidad_tarimas ?? 0,
            cantidad_cajas ?? 0,
            cantidad_bloques ?? 0,
            tipo_ocupacion ?? 1,
            id_mantenimiento,
            estado,
            observaciones,
            id_ocupacion
        ]
    );

    return result.rows[0];
};


// Cerrar ocupación (fecha_fin, hora_fin y estado = 0)
const cerrarOcupacion = async (
    id_ocupacion,
    { fecha_fin, hora_fin }
) => {

    const result = await db.query(
        `
        UPDATE ocupaciones_camaras
        SET
            fecha_fin = $1,
            hora_fin = $2,
            estado = 0
        WHERE id_ocupacion = $3
        RETURNING *
        `,
        [
            fecha_fin,
            hora_fin,
            id_ocupacion
        ]
    );

    return result.rows[0];
};


// Eliminar ocupación
const deleteOcupacion = async (id_ocupacion) => {

    const result = await db.query(
        `
        DELETE FROM ocupaciones_camaras
        WHERE id_ocupacion = $1
        RETURNING *
        `,
        [id_ocupacion]
    );

    return result.rows[0];
};


const ocupacionesModel = {
    getOcupaciones,
    getOcupacionById,
    getOcupacionesByCamara,
    getOcupacionesActivas,
    createOcupacion,
    updateOcupacion,
    cerrarOcupacion,
    deleteOcupacion
};
export default ocupacionesModel;
