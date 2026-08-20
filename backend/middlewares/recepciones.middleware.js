// Valida el body al crear una recepción
export const validarRecepcion = (req, res, next) => {
    const {
        id_produccion,
        id_camara,
        fecha_recepcion,
        hora_recepcion,
        cajas_recibidas,
        tarimas_recibidas,
        temperatura,
        estado
    } = req.body;

    // ----- Obligatorios -----
    if (!id_produccion || isNaN(Number(id_produccion))) {
        return res.status(400).json({
            error: 'El campo "id_produccion" es obligatorio y debe ser un número válido'
        });
    }
    if (!fecha_recepcion) {
        return res.status(400).json({
            error: 'El campo "fecha_recepcion" es obligatorio'
        });
    }
    if (!hora_recepcion) {
        return res.status(400).json({
            error: 'El campo "hora_recepcion" es obligatorio'
        });
    }

    // ----- Opcionales (validados solo si vienen) -----
    // id_camara puede ser NULL (el trigger usa la cámara de la producción).
    if (
        id_camara !== undefined &&
        id_camara !== null &&
        id_camara !== "" &&
        isNaN(Number(id_camara))
    ) {
        return res.status(400).json({
            error: 'El campo "id_camara" debe ser numérico o nulo'
        });
    }
    if (
        cajas_recibidas !== undefined &&
        cajas_recibidas !== null &&
        isNaN(Number(cajas_recibidas))
    ) {
        return res.status(400).json({
            error: 'El campo "cajas_recibidas" debe ser numérico'
        });
    }
    if (
        tarimas_recibidas !== undefined &&
        tarimas_recibidas !== null &&
        isNaN(Number(tarimas_recibidas))
    ) {
        return res.status(400).json({
            error: 'El campo "tarimas_recibidas" debe ser numérico'
        });
    }
    if (
        temperatura !== undefined &&
        temperatura !== null &&
        temperatura !== "" &&
        isNaN(Number(temperatura))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura" debe ser numérico'
        });
    }
    if (
        estado !== undefined &&
        estado !== null &&
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico (1=activa, 0=cancelada)'
        });
    }

    // Al menos algo debe recibirse
    const cajas = Number(cajas_recibidas) || 0;
    const tarimas = Number(tarimas_recibidas) || 0;
    if (cajas <= 0 && tarimas <= 0) {
        return res.status(400).json({
            error: "Debes registrar al menos cajas o tarimas recibidas"
        });
    }

    next();
};

// Valida que el id en los params sea un número
export const validarIdRecepcion = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de recepción debe ser un número válido"
        });
    }
    next();
};
