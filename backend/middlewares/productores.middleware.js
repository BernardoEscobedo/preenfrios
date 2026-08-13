// Valida el body al crear o actualizar un productor
export const validarProductor = (req, res, next) => {

    const {
        codigo_productor,
        nombre,
        activo
    } = req.body;

    if (
        !codigo_productor ||
        typeof codigo_productor !== "string" ||
        codigo_productor.trim() === "" ||
        codigo_productor.length > 4
    ) {
        return res.status(400).json({
            error: 'El campo "codigo_productor" es obligatorio, debe ser texto y máximo 4 caracteres'
        });
    }

    if (
        !nombre ||
        typeof nombre !== "string" ||
        nombre.trim() === ""
    ) {
        return res.status(400).json({
            error: 'El campo "nombre" es obligatorio y debe ser texto'
        });
    }

    if (
        activo !== undefined &&
        typeof activo !== "boolean"
    ) {
        return res.status(400).json({
            error: 'El campo "activo" debe ser booleano'
        });
    }

    next();
};


// Valida que el id_productor en los params sea un número
export const validarIdProductor = (req, res, next) => {

    const { id } = req.params;

    if (!id || isNaN(Number(id))) {

        return res.status(400).json({
            error: "El id de productor debe ser un número válido"
        });

    }

    next();
};
