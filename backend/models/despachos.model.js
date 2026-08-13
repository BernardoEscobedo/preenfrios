import { db } from "../database/connection.database.js";

// =========================================================
// NOTA DE DISEÑO
// despachos.cantidad_tarimas / cantidad_cajas se recalculan
// desde despachos_detalle en createDespacho (transacción) y en
// recalcularTotales(). No hay trigger en la BD para esto, así
// que el total lo controla este modelo para no descuadrar.
// El descuento de cámara (ocupaciones) lo maneja el trigger
// fn_sync_ocupacion_movimiento al registrar movimientos_inventario
// tipo=3 (salida_despacho). Ver módulo movimientos_inventario.
// =========================================================

// Obtener todos los despachos (con datos de transporte y cliente)
const getDespachos = async () => {
    const result = await db.query(
        `
        SELECT
            d.*,
            t.razon_social,
            t.nombre_operador,
            cc.cliente,
            cc.cedis,
            cc.acronimo
        FROM despachos d
        LEFT JOIN transportes t ON t.id_transporte = d.id_transporte
        LEFT JOIN cedis_cliente cc ON cc.id_cc = d.id_cc
        ORDER BY d.id_despacho DESC
        `
    );
    return result.rows;
};

// Obtener un despacho por ID
const getDespachoById = async (id_despacho) => {
    const result = await db.query(
        `
        SELECT
            d.*,
            t.razon_social,
            t.nombre_operador,
            cc.cliente,
            cc.cedis,
            cc.acronimo
        FROM despachos d
        LEFT JOIN transportes t ON t.id_transporte = d.id_transporte
        LEFT JOIN cedis_cliente cc ON cc.id_cc = d.id_cc
        WHERE d.id_despacho = $1
        `,
        [id_despacho]
    );
    return result.rows[0];
};

// Obtener un despacho con su detalle (por bloque + lote)
const getDespachoConDetalle = async (id_despacho) => {
    const despacho = await getDespachoById(id_despacho);
    if (!despacho) {
        return null;
    }
    const detalleResult = await db.query(
        `
        SELECT
            dd.*,
            b.codigo_bloque,
            l.codigo_lote
        FROM despachos_detalle dd
        LEFT JOIN bloques_fruta b ON b.id_bloque = dd.id_bloque
        JOIN lotes l ON l.id_lote = dd.id_lote
        WHERE dd.id_despacho = $1
        ORDER BY dd.id_detalle ASC
        `,
        [id_despacho]
    );
    return {
        ...despacho,
        detalle: detalleResult.rows
    };
};

// Recalcular totales del encabezado a partir del detalle
const recalcularTotales = async (client, id_despacho) => {
    await client.query(
        `
        UPDATE despachos
        SET
            cantidad_tarimas = COALESCE((
                SELECT SUM(cantidad_tarimas)
                FROM despachos_detalle
                WHERE id_despacho = $1
            ), 0),
            cantidad_cajas = COALESCE((
                SELECT SUM(cantidad_cajas)
                FROM despachos_detalle
                WHERE id_despacho = $1
            ), 0)
        WHERE id_despacho = $1
        `,
        [id_despacho]
    );
};

// Crear despacho + detalle en una sola transacción
// body = { ...encabezado, detalle: [ { id_bloque, id_lote, cantidad_tarimas, cantidad_cajas, temperatura, observaciones } ] }
const createDespacho = async ({
    folio_despacho,
    id_transporte,
    fecha_despacho,
    hora_salida,
    id_cc,
    orden_venta,
    cita,
    fecha_cita,
    temperatura_salida,
    estado,
    observaciones,
    detalle = []
}) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const despachoResult = await client.query(
            `
            INSERT INTO despachos (
                folio_despacho,
                id_transporte,
                fecha_despacho,
                hora_salida,
                id_cc,
                orden_venta,
                cita,
                fecha_cita,
                cantidad_tarimas,
                cantidad_cajas,
                temperatura_salida,
                estado,
                observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10, $11)
            RETURNING *
            `,
            [
                folio_despacho,
                id_transporte,
                fecha_despacho,
                hora_salida,
                id_cc,
                orden_venta,
                cita,
                fecha_cita,
                temperatura_salida,
                estado,
                observaciones
            ]
        );
        const despacho = despachoResult.rows[0];

        for (const linea of detalle) {
            await client.query(
                `
                INSERT INTO despachos_detalle (
                    id_despacho,
                    id_bloque,
                    id_lote,
                    cantidad_tarimas,
                    cantidad_cajas,
                    temperatura,
                    observaciones
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                [
                    despacho.id_despacho,
                    linea.id_bloque || null,
                    linea.id_lote,
                    linea.cantidad_tarimas,
                    linea.cantidad_cajas,
                    linea.temperatura || null,
                    linea.observaciones || null
                ]
            );
        }

        await recalcularTotales(client, despacho.id_despacho);

        await client.query("COMMIT");

        // Devolver el despacho ya con totales recalculados + detalle
        return await getDespachoConDetalle(despacho.id_despacho);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Agregar una línea de detalle a un despacho existente
const addDetalle = async (
    id_despacho,
    { id_bloque, id_lote, cantidad_tarimas, cantidad_cajas, temperatura, observaciones }
) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `
            INSERT INTO despachos_detalle (
                id_despacho,
                id_bloque,
                id_lote,
                cantidad_tarimas,
                cantidad_cajas,
                temperatura,
                observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                id_despacho,
                id_bloque || null,
                id_lote,
                cantidad_tarimas,
                cantidad_cajas,
                temperatura || null,
                observaciones || null
            ]
        );
        await recalcularTotales(client, id_despacho);
        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Eliminar una línea de detalle y recalcular totales
const deleteDetalle = async (id_detalle) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `
            DELETE FROM despachos_detalle
            WHERE id_detalle = $1
            RETURNING *
            `,
            [id_detalle]
        );
        const eliminado = result.rows[0];
        if (eliminado) {
            await recalcularTotales(client, eliminado.id_despacho);
        }
        await client.query("COMMIT");
        return eliminado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Actualizar encabezado del despacho (no toca los totales del detalle)
const updateDespacho = async (
    id_despacho,
    {
        folio_despacho,
        id_transporte,
        fecha_despacho,
        hora_salida,
        id_cc,
        orden_venta,
        cita,
        fecha_cita,
        temperatura_salida,
        estado,
        observaciones
    }
) => {
    const result = await db.query(
        `
        UPDATE despachos
        SET
            folio_despacho = $1,
            id_transporte = $2,
            fecha_despacho = $3,
            hora_salida = $4,
            id_cc = $5,
            orden_venta = $6,
            cita = $7,
            fecha_cita = $8,
            temperatura_salida = $9,
            estado = $10,
            observaciones = $11
        WHERE id_despacho = $12
        RETURNING *
        `,
        [
            folio_despacho,
            id_transporte,
            fecha_despacho,
            hora_salida,
            id_cc,
            orden_venta,
            cita,
            fecha_cita,
            temperatura_salida,
            estado,
            observaciones,
            id_despacho
        ]
    );
    return result.rows[0];
};

// Eliminar despacho (borra su detalle en transacción)
const deleteDespacho = async (id_despacho) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            `DELETE FROM despachos_detalle WHERE id_despacho = $1`,
            [id_despacho]
        );
        const result = await client.query(
            `DELETE FROM despachos WHERE id_despacho = $1 RETURNING *`,
            [id_despacho]
        );
        await client.query("COMMIT");
        return result.rows[0];
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const despachosModel = {
    getDespachos,
    getDespachoById,
    getDespachoConDetalle,
    createDespacho,
    addDetalle,
    deleteDetalle,
    updateDespacho,
    deleteDespacho
};

export default despachosModel;
