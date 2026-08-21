import { db } from "../database/connection.database.js";

// La calidad ahora se toma de sku_pt (s.calidad AS calidad_sku), ya NO
// existe la columna produccion.calidad.

// Obtener todas las producciones (con nombres legibles de catálogos)
const getProducciones = async () => {
    const result = await db.query(
        `
        SELECT
            p.*,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.codigo_productor,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            s.calidad           AS calidad_sku,
            cc.cliente,
            cc.cedis,
            cc.acronimo         AS acronimo_cc,
            cam.nombre_camara,
            cam.tipo_camara
        FROM produccion p
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = p.id_camara
        ORDER BY p.id_produccion DESC
        `
    );
    return result.rows;
};

// Obtener una producción por ID
const getProduccionById = async (id_produccion) => {
    const result = await db.query(
        `
        SELECT
            p.*,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.codigo_productor,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            s.calidad           AS calidad_sku,
            cc.cliente,
            cc.cedis,
            cc.acronimo         AS acronimo_cc,
            cam.nombre_camara,
            cam.tipo_camara
        FROM produccion p
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = p.id_camara
        WHERE p.id_produccion = $1
        `,
        [id_produccion]
    );
    return result.rows[0];
};

// Obtener producciones por semana
const getProduccionesBySemana = async (semana) => {
    const result = await db.query(
        `
        SELECT
            p.*,
            f.codigo_finca,
            f.nombre            AS nombre_finca,
            pr.codigo_productor,
            pr.nombre           AS nombre_productor,
            s.codigo_sku,
            s.calidad           AS calidad_sku,
            cc.cliente,
            cc.cedis,
            cc.acronimo         AS acronimo_cc,
            cam.nombre_camara,
            cam.tipo_camara
        FROM produccion p
        JOIN fincas         f   ON f.id_finca      = p.id_finca
        JOIN productores    pr  ON pr.id_productor = p.id_productor
        JOIN sku_pt         s   ON s.id_sku        = p.id_sku
        JOIN cedis_cliente  cc  ON cc.id_cc        = p.id_cc
        LEFT JOIN camaras   cam ON cam.id_camara   = p.id_camara
        WHERE p.semana = $1
        ORDER BY p.id_produccion DESC
        `,
        [semana]
    );
    return result.rows;
};

// Crear producción (sin calidad)
const createProduccion = async ({
    semana,
    region,
    id_finca,
    id_productor,
    fecha_empaque,
    transito,
    fecha_entrega,
    id_cc,
    id_sku,
    cajas_procesadas,
    estiba_pallets,
    comentarios,
    id_camara,
    estado
}) => {
    const result = await db.query(
        `
        INSERT INTO produccion (
            semana,
            region,
            id_finca,
            id_productor,
            fecha_empaque,
            transito,
            fecha_entrega,
            id_cc,
            id_sku,
            cajas_procesadas,
            estiba_pallets,
            comentarios,
            id_camara,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
        `,
        [
            semana,
            region,
            id_finca,
            id_productor,
            fecha_empaque,
            transito,
            fecha_entrega,
            id_cc,
            id_sku,
            cajas_procesadas ?? 0,
            estiba_pallets ?? 0,
            comentarios,
            // id_camara puede ser NULL (no se preenfría / CEDA directo)
            id_camara ?? null,
            estado ?? 1
        ]
    );
    return result.rows[0];
};

// Actualizar producción (sin calidad)
const updateProduccion = async (
    id_produccion,
    {
        semana,
        region,
        id_finca,
        id_productor,
        fecha_empaque,
        transito,
        fecha_entrega,
        id_cc,
        id_sku,
        cajas_procesadas,
        estiba_pallets,
        comentarios,
        id_camara,
        estado
    }
) => {
    const result = await db.query(
        `
        UPDATE produccion
        SET
            semana = $1,
            region = $2,
            id_finca = $3,
            id_productor = $4,
            fecha_empaque = $5,
            transito = $6,
            fecha_entrega = $7,
            id_cc = $8,
            id_sku = $9,
            cajas_procesadas = $10,
            estiba_pallets = $11,
            comentarios = $12,
            id_camara = $13,
            estado = $14
        WHERE id_produccion = $15
        RETURNING *
        `,
        [
            semana,
            region,
            id_finca,
            id_productor,
            fecha_empaque,
            transito,
            fecha_entrega,
            id_cc,
            id_sku,
            cajas_procesadas ?? 0,
            estiba_pallets ?? 0,
            comentarios,
            id_camara ?? null,
            estado ?? 1,
            id_produccion
        ]
    );
    return result.rows[0];
};

// Eliminar producción
const deleteProduccion = async (id_produccion) => {
    const result = await db.query(
        `
        DELETE FROM produccion
        WHERE id_produccion = $1
        RETURNING *
        `,
        [id_produccion]
    );
    return result.rows[0];
};

const produccionModel = {
    getProducciones,
    getProduccionById,
    getProduccionesBySemana,
    createProduccion,
    updateProduccion,
    deleteProduccion
};

export default produccionModel;