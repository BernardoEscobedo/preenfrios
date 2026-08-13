// Valida el body al crear o actualizar un transporte
export const validarTransporte = (req, res, next) => {
    const {
        razon_social,
        nombre_operador,
        celular,
        placas_tracto,
        placas_caja,
        no_economico_caja
    } = req.body;

    if (
        !razon_social ||
        typeof razon_social !== "string" ||
        razon_social.trim() === "" ||
        razon_social.length > 100
    ) {
        return res.status(400).json({
            error: 'El campo "razon_social" es obligatorio, debe ser texto y máximo 100 caracteres'
        });
    }
    if (
        nombre_operador !== undefined &&
        nombre_operador !== null &&
        (typeof nombre_operador !== "string" || nombre_operador.length > 100)
    ) {
        return res.status(400).json({
            error: 'El campo "nombre_operador" debe ser texto y máximo 100 caracteres'
        });
    }
    if (
        celular !== undefined &&
        celular !== null &&
        (typeof celular !== "string" || celular.length > 10)
    ) {
        return res.status(400).json({
            error: 'El campo "celular" debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        placas_tracto !== undefined &&
        placas_tracto !== null &&
        (typeof placas_tracto !== "string" || placas_tracto.length > 10)
    ) {
        return res.status(400).json({
            error: 'El campo "placas_tracto" debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        placas_caja !== undefined &&
        placas_caja !== null &&
        (typeof placas_caja !== "string" || placas_caja.length > 10)
    ) {
        return res.status(400).json({
            error: 'El campo "placas_caja" debe ser texto y máximo 10 caracteres'
        });
    }
    if (
        no_economico_caja !== undefined &&
        no_economico_caja !== null &&
        (typeof no_economico_caja !== "string" || no_economico_caja.length > 10)
    ) {
        return res.status(400).json({
            error: 'El campo "no_economico_caja" debe ser texto y máximo 10 caracteres'
        });
    }
    next();
};

// Valida que el id_transporte en los params sea un número
export const validarIdTransporte = (req, res, next) => {
    const { id_transporte } = req.params;
    if (!id_transporte || isNaN(Number(id_transporte))) {
        return res.status(400).json({
            error: "El id de transporte debe ser un número válido"
        });
    }
    next();
};
