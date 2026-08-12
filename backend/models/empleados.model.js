const pool = require('../database/db');

// Obtener todos los empleados
const getEmpleados = async () => {
    const result = await pool.query(
        'SELECT * FROM empleados ORDER BY id_empleado ASC'
    );
    return result.rows;
};

// Obtener un empleado por id
const getEmpleadoById = async (id_empleado) => {
    const result = await pool.query(
        'SELECT * FROM empleados WHERE id_empleado = $1',
        [id_empleado]
    );
    return result.rows[0];
};

// Crear un nuevo empleado
const createEmpleado = async ({ nombre, apellidos, turno, zona }) => {
    const result = await pool.query(
        `INSERT INTO empleados (nombre, apellidos, turno, zona)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [nombre, apellidos, turno, zona]
    );
    return result.rows[0];
};

// Actualizar un empleado existente
const updateEmpleado = async (id_empleado, { nombre, apellidos, turno, zona }) => {
    const result = await pool.query(
        `UPDATE empleados
         SET nombre = $1,
             apellidos = $2,
             turno = $3,
             zona = $4
         WHERE id_empleado = $5
         RETURNING *`,
        [nombre, apellidos, turno, zona, id_empleado]
    );
    return result.rows[0];
};

// Eliminar un empleado
const deleteEmpleado = async (id_empleado) => {
    const result = await pool.query(
        'DELETE FROM empleados WHERE id_empleado = $1 RETURNING *',
        [id_empleado]
    );
    return result.rows[0];
};

export const empleadosModel= {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
};