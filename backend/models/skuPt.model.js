import { db } from "../database/connection.database.js";


// Obtener todos los SKU
const getSkuPt = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM sku_pt
        ORDER BY id_sku ASC
        `
    );

    return result.rows;
};


// Obtener un SKU por ID
const getSkuPtById = async (id_sku) => {

    const result = await db.query(
        `
        SELECT *
        FROM sku_pt
        WHERE id_sku = $1
        `,
        [id_sku]
    );

    return result.rows[0];
};


// Crear SKU
const createSkuPt = async ({
    codigo_sku,
    calidad
}) => {

    const result = await db.query(
        `
        INSERT INTO sku_pt (
            codigo_sku,
            calidad
        )
        VALUES ($1, $2)
        RETURNING *
        `,
        [
            codigo_sku,
            calidad
        ]
    );

    return result.rows[0];
};


// Actualizar SKU
const updateSkuPt = async (
    id_sku,
    {
        codigo_sku,
        calidad
    }
) => {

    const result = await db.query(
        `
        UPDATE sku_pt
        SET
            codigo_sku = $1,
            calidad = $2
        WHERE id_sku = $3
        RETURNING *
        `,
        [
            codigo_sku,
            calidad,
            id_sku
        ]
    );

    return result.rows[0];
};


// Eliminar SKU
const deleteSkuPt = async (id_sku) => {

    const result = await db.query(
        `
        DELETE FROM sku_pt
        WHERE id_sku = $1
        RETURNING *
        `,
        [id_sku]
    );

    return result.rows[0];
};


const skuPtModel = {
    getSkuPt,
    getSkuPtById,
    createSkuPt,
    updateSkuPt,
    deleteSkuPt
};
export default skuPtModel;
