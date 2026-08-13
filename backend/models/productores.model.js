import { db } from "../database/connection.database.js";


// Obtener todos los productores
const getProductores = async () => {

    const result = await db.query(
        `
        SELECT *
        FROM productores
        ORDER BY id_productor ASC
        `
    );

    return result.rows;
};


// Obtener un productor por ID
const getProductorById = async (id_productor) => {

    const result = await db.query(
        `
        SELECT *
        FROM productores
        WHERE id_productor = $1
        `,
        [id_productor]
    );

    return result.rows[0];
};


// Crear productor
const createProductor = async ({
    codigo_productor,
    nombre,
    activo
}) => {

    const result = await db.query(
        `
        INSERT INTO productores (
            codigo_productor,
            nombre,
            activo
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            codigo_productor,
            nombre,
            activo ?? true
        ]
    );

    return result.rows[0];
};


// Actualizar productor
const updateProductor = async (
    id_productor,
    {
        codigo_productor,
        nombre,
        activo
    }
) => {

    const result = await db.query(
        `
        UPDATE productores
        SET
            codigo_productor = $1,
            nombre = $2,
            activo = $3
        WHERE id_productor = $4
        RETURNING *
        `,
        [
            codigo_productor,
            nombre,
            activo,
            id_productor
        ]
    );

    return result.rows[0];
};


// Eliminar productor
const deleteProductor = async (id_productor) => {

    const result = await db.query(
        `
        DELETE FROM productores
        WHERE id_productor = $1
        RETURNING *
        `,
        [id_productor]
    );

    return result.rows[0];
};


const productoresModel = {
    getProductores,
    getProductorById,
    createProductor,
    updateProductor,
    deleteProductor
};
export default productoresModel;
