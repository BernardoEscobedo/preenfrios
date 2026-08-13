// Valida una línea de detalle de despacho
const validarLineaDetalle = (linea) => {
    if (!linea || typeof linea !== "object") {
        return "Cada línea de detalle debe ser un objeto válido";
    }
    if (!linea.id_lote || isNaN(Number(linea.id_lote))) {
        return 'Cada detalle requiere un "id_lote" numérico válido';
    }
    if (
        linea.id_bloque !== undefined &&
        linea.id_bloque !== null &&
        isNaN(Number(linea.id_bloque))
    ) {
        return 'El "id_bloque" del detalle debe ser numérico';
    }
    if (
        linea.cantidad_tarimas === undefined ||
        linea.cantidad_tarimas === null ||
        isNaN(Number(linea.cantidad_tarimas)) ||
        Number(linea.cantidad_tarimas) < 0
    ) {
        return 'Cada detalle requiere "cantidad_tarimas" numérica (>= 0)';
    }
    if (
        linea.cantidad_cajas === undefined ||
        linea.cantidad_cajas === null ||
        isNaN(Number(linea.cantidad_cajas)) ||
        Number(linea.cantidad_cajas) < 0
    ) {
        return 'Cada detalle requiere "cantidad_cajas" numérica (>= 0)';
    }
    if (
        linea.temperatura !== undefined &&
        linea.temperatura !== null &&
        isNaN(Number(linea.temperatura))
    ) {
        return 'La "temperatura" del detalle debe ser numérica';
    }
    return null;
};

// Valida el body al crear un despacho (encabezado + detalle opcional)
export const validarDespacho = (req, res, next) => {
    const {
        folio_despacho,
        fecha_despacho,
        fecha_cita,
        temperatura_salida,
        estado,
        detalle
    } = req.body;

    if (
        folio_despacho !== undefined &&
        folio_despacho !== null &&
        (typeof folio_despacho !== "string" || folio_despacho.length > 10)
    ) {
        return res.status(400).json({
            error: 'El campo "folio_despacho" debe ser texto y máximo 10 caracteres'
        });
    }
    if (!fecha_despacho || isNaN(Date.parse(fecha_despacho))) {
        return res.status(400).json({
            error: 'El campo "fecha_despacho" es obligatorio y debe ser una fecha válida'
        });
    }
    if (
        fecha_cita !== undefined &&
        fecha_cita !== null &&
        fecha_cita !== "" &&
        isNaN(Date.parse(fecha_cita))
    ) {
        return res.status(400).json({
            error: 'El campo "fecha_cita" debe ser una fecha válida'
        });
    }
    if (
        temperatura_salida !== undefined &&
        temperatura_salida !== null &&
        isNaN(Number(temperatura_salida))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_salida" debe ser numérico'
        });
    }
    if (
        estado !== undefined &&
        estado !== null &&
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" debe ser numérico'
        });
    }
    if (detalle !== undefined && detalle !== null) {
        if (!Array.isArray(detalle)) {
            return res.status(400).json({
                error: 'El campo "detalle" debe ser un arreglo de líneas'
            });
        }
        for (const linea of detalle) {
            const err = validarLineaDetalle(linea);
            if (err) {
                return res.status(400).json({ error: err });
            }
        }
    }
    next();
};

// Valida una línea de detalle al agregarla individualmente
export const validarDetalle = (req, res, next) => {
    const err = validarLineaDetalle(req.body);
    if (err) {
        return res.status(400).json({ error: err });
    }
    next();
};

// Valida que el id (despacho) en params sea numérico
export const validarIdDespacho = (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
        return res.status(400).json({
            error: "El id de despacho debe ser un número válido"
        });
    }
    next();
};

// Valida que el id_detalle en params sea numérico
export const validarIdDetalle = (req, res, next) => {
    const { id_detalle } = req.params;
    if (!id_detalle || isNaN(Number(id_detalle))) {
        return res.status(400).json({
            error: "El id de detalle debe ser un número válido"
        });
    }
    next();
};
