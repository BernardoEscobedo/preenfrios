import { db } from "../database/connection.database.js";

// =========================================================
// RECEPCIONES ESPERADAS (vista) — el corazón del módulo
// Muestra cada línea de producción con lo esperado vs. lo ya
// recibido y lo pendiente. Trae nombres legibles de catálogos.
// =========================================================
const getRecepcionesEsperadas = async () => {
    const result = await db.query(
        `
        SELECT *
        FROM vw_recepciones_esperadas
        ORDER BY id_produccion DESC
        `
    );
    return result.rows;
};

// Recepciones esperadas de una semana específica
const getRecepcionesEsperadasBySemana = async (semana) => {
    const result = await db.query(
        `
        SELECT *
        FROM vw_recepciones_esperadas
        WHERE semana = $1
        ORDER BY id_produccion DESC
        `,
        [semana]
    );
    return result.rows;
};

// Solo lo que sigue pendiente por recibir (cajas_pendientes > 0)
// y que sí se preenfría (tiene cámara asignada).
const getPendientes = async () => {
    const result = await db.query(
        `
        SELECT *
        FROM vw_recepciones_esperadas
        WHERE cajas_pendientes > 0
          AND se_preenfria = TRUE
        ORDER BY fecha_entrega ASC NULLS LAST, id_produccion DESC
        `
    );
    return result.rows;
};

// =========================================================
// RECEPCIONES (registros reales)
// =========================================================

// Obtener todas las recepciones (con datos legibles de producción/cámara)
const getRecepciones = async () => {
    const result = await db.query(
        `
        SELECT
            r.*,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            cc.cliente,
            cc.cedis,
            cam.nombre_camara,
            cam.tipo_camara,
            e.nombre            AS nombre_empleado
        FROM recepciones r
        JOIN produccion     p   ON p.id_produccion = r.id_produccion
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = r.id_camara
        LEFT JOIN usuarios  u   ON u.id_usuario    = r.id_usuario
        LEFT JOIN empleados e   ON e.id_empleado   = u.id_empleado
        ORDER BY r.id_recepcion DESC
        `
    );
    return result.rows;
};

// Obtener una recepción por ID
const getRecepcionById = async (id_recepcion) => {
    const result = await db.query(
        `
        SELECT
            r.*,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            cc.cliente,
            cc.cedis,
            cam.nombre_camara,
            cam.tipo_camara
        FROM recepciones r
        JOIN produccion     p   ON p.id_produccion = r.id_produccion
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = r.id_camara
        WHERE r.id_recepcion = $1
        `,
        [id_recepcion]
    );
    return result.rows[0];
};

// Obtener recepciones de una producción concreta
const getRecepcionesByProduccion = async (id_produccion) => {
    const result = await db.query(
        `
        SELECT
            r.*,
            cam.nombre_camara,
            cam.tipo_camara
        FROM recepciones r
        LEFT JOIN camaras cam ON cam.id_camara = r.id_camara
        WHERE r.id_produccion = $1
        ORDER BY r.fecha_recepcion DESC, r.hora_recepcion DESC
        `,
        [id_produccion]
    );
    return result.rows;
};

// Crear recepción
// (el trigger de la BD ocupa la cámara y actualiza el estado de producción)
const createRecepcion = async ({
    id_produccion,
    id_camara,
    fecha_recepcion,
    hora_recepcion,
    cajas_recibidas,
    tarimas_recibidas,
    temperatura,
    id_usuario,
    estado,
    observaciones
}) => {
    const result = await db.query(
        `
        INSERT INTO recepciones (
            id_produccion,
            id_camara,
            fecha_recepcion,
            hora_recepcion,
            cajas_recibidas,
            tarimas_recibidas,
            temperatura,
            id_usuario,
            estado,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
        `,
        [
            id_produccion,
            // id_camara puede ser NULL (el trigger toma la de la producción)
            id_camara ?? null,
            fecha_recepcion,
            hora_recepcion,
            cajas_recibidas ?? 0,
            tarimas_recibidas ?? 0,
            temperatura ?? null,
            id_usuario ?? null,
            estado ?? 1,
            observaciones ?? null
        ]
    );
    return result.rows[0];
};

// Actualizar recepción
const updateRecepcion = async (
    id_recepcion,
    {
        id_camara,
        fecha_recepcion,
        hora_recepcion,
        cajas_recibidas,
        tarimas_recibidas,
        temperatura,
        estado,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE recepciones
        SET
            id_camara = $1,
            fecha_recepcion = $2,
            hora_recepcion = $3,
            cajas_recibidas = $4,
            tarimas_recibidas = $5,
            temperatura = $6,
            estado = $7,
            observaciones = $8
        WHERE id_recepcion = $9
        RETURNING *
        `,
        [
            id_camara ?? null,
            fecha_recepcion,
            hora_recepcion,
            cajas_recibidas ?? 0,
            tarimas_recibidas ?? 0,
            temperatura ?? null,
            estado ?? 1,
            observaciones ?? null,
            id_recepcion
        ]
    );
    return result.rows[0];
};

// Cancelar recepción (estado = 0). El trigger de estado de producción
// recalcula el pendiente automáticamente al cambiar el estado.
const cancelarRecepcion = async (id_recepcion) => {
    const result = await db.query(
        `
        UPDATE recepciones
        SET estado = 0
        WHERE id_recepcion = $1
        RETURNING *
        `,
        [id_recepcion]
    );
    return result.rows[0];
};

// Eliminar recepción
const deleteRecepcion = async (id_recepcion) => {
    const result = await db.query(
        `
        DELETE FROM recepciones
        WHERE id_recepcion = $1
        RETURNING *
        `,
        [id_recepcion]
    );
    return result.rows[0];
};

const recepcionesModel = {
    getRecepcionesEsperadas,
    getRecepcionesEsperadasBySemana,
    getPendientes,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    createRecepcion,
    updateRecepcion,
    cancelarRecepcion,
    deleteRecepcion
};

export default recepcionesModel;
