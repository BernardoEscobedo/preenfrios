import { db } from "../database/connection.database.js";

// =========================================================
// NOTA DE DISEÑO
// Al INSERTAR en movimientos_inventario, el trigger de la BD
// fn_sync_ocupacion_movimiento actualiza automáticamente
// ocupaciones_camaras (descuenta origen / suma destino).
// Por eso los movimientos se tratan como bitácora inmutable:
// se ofrecen GET, POST y DELETE, pero NO update (para no
// descuadrar las ocupaciones ya sincronizadas por el trigger).
// tipo_movimiento: 1=ingreso_preenfrio, 2=preenfrio_a_conserva,
//                  3=salida_despacho
// =========================================================

// Obtener todos los movimientos (con datos de lote, cámaras y usuario)
const getMovimientos = async () => {
    const result = await db.query(
        `
        SELECT
            m.*,
            l.codigo_lote,
            co.nombre_camara AS camara_origen,
            cd.nombre_camara AS camara_destino,
            u.usuario
        FROM movimientos_inventario m
        JOIN lotes l ON l.id_lote = m.id_lote
        LEFT JOIN camaras co ON co.id_camara = m.id_camara_origen
        LEFT JOIN camaras cd ON cd.id_camara = m.id_camara_destino
        LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
        ORDER BY m.id_movimiento DESC
        `
    );
    return result.rows;
};

// Obtener un movimiento por ID
const getMovimientoById = async (id_movimiento) => {
    const result = await db.query(
        `
        SELECT
            m.*,
            l.codigo_lote,
            co.nombre_camara AS camara_origen,
            cd.nombre_camara AS camara_destino,
            u.usuario
        FROM movimientos_inventario m
        JOIN lotes l ON l.id_lote = m.id_lote
        LEFT JOIN camaras co ON co.id_camara = m.id_camara_origen
        LEFT JOIN camaras cd ON cd.id_camara = m.id_camara_destino
        LEFT JOIN usuarios u ON u.id_usuario = m.id_usuario
        WHERE m.id_movimiento = $1
        `,
        [id_movimiento]
    );
    return result.rows[0];
};

// Obtener movimientos por lote (trazabilidad del lote)
const getMovimientosByLote = async (id_lote) => {
    const result = await db.query(
        `
        SELECT
            m.*,
            co.nombre_camara AS camara_origen,
            cd.nombre_camara AS camara_destino
        FROM movimientos_inventario m
        LEFT JOIN camaras co ON co.id_camara = m.id_camara_origen
        LEFT JOIN camaras cd ON cd.id_camara = m.id_camara_destino
        WHERE m.id_lote = $1
        ORDER BY m.fecha_movimiento ASC, m.hora_movimiento ASC
        `,
        [id_lote]
    );
    return result.rows;
};

// Crear movimiento (el trigger sincroniza ocupaciones_camaras)
const createMovimiento = async ({
    id_lote,
    tipo_movimiento,
    id_camara_origen,
    id_camara_destino,
    id_despacho,
    fecha_movimiento,
    hora_movimiento,
    cantidad_tarimas,
    cantidad_cajas,
    temperatura,
    id_usuario,
    observaciones
}) => {
    const result = await db.query(
        `
        INSERT INTO movimientos_inventario (
            id_lote,
            tipo_movimiento,
            id_camara_origen,
            id_camara_destino,
            id_despacho,
            fecha_movimiento,
            hora_movimiento,
            cantidad_tarimas,
            cantidad_cajas,
            temperatura,
            id_usuario,
            observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        `,
        [
            id_lote,
            tipo_movimiento,
            id_camara_origen || null,
            id_camara_destino || null,
            id_despacho || null,
            fecha_movimiento,
            hora_movimiento,
            cantidad_tarimas,
            cantidad_cajas,
            temperatura || null,
            id_usuario || null,
            observaciones || null
        ]
    );
    return result.rows[0];
};

// Eliminar movimiento
// OJO: el trigger NO revierte la ocupación al borrar. Usar sólo para
// corregir capturas erróneas y ajustar ocupaciones_camaras manualmente
// si aplica.
const deleteMovimiento = async (id_movimiento) => {
    const result = await db.query(
        `
        DELETE FROM movimientos_inventario
        WHERE id_movimiento = $1
        RETURNING *
        `,
        [id_movimiento]
    );
    return result.rows[0];
};

const movimientosInventarioModel = {
    getMovimientos,
    getMovimientoById,
    getMovimientosByLote,
    createMovimiento,
    deleteMovimiento
};

export default movimientosInventarioModel;
