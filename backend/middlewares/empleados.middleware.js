// Valida el body al crear o actualizar un empleado
const validarEmpleado = (req, res, next) => {
    const { nombre, apellidos, turno, zona } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ error: 'El campo "nombre" es obligatorio y debe ser texto' });
    }

    if (!apellidos || typeof apellidos !== 'string' || apellidos.trim() === '') {
        return res.status(400).json({ error: 'El campo "apellidos" es obligatorio y debe ser texto' });
    }

    if (turno !== undefined && typeof turno !== 'string') {
        return res.status(400).json({ error: 'El campo "turno" debe ser texto' });
    }

    if (zona !== undefined && typeof zona !== 'string') {
        return res.status(400).json({ error: 'El campo "zona" debe ser texto' });
    }

    next();
};

// Valida que el id_empleado en los params sea un número
const validarIdEmpleado = (req, res, next) => {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'El id de empleado debe ser un número válido' });
    }

    next();
};

module.exports = {
    validarEmpleado,
    validarIdEmpleado,
};