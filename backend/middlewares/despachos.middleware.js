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
// Alineado al esquema: orden_venta, cita, fecha_cita, hora_salida,
// temperatura_salida, estado y observaciones son NOT NULL.
export const validarDespacho = (req, res, next) => {
    const {
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
        detalle
    } = req.body;

    if (
        !folio_despacho ||
        typeof folio_despacho !== "string" ||
        folio_despacho.trim() === "" ||
        folio_despacho.length > 10
    ) {
        return res.status(400).json({
            error: 'El campo "folio_despacho" es obligatorio, debe ser texto y máximo 10 caracteres'
        });
    }
    if (!id_transporte || isNaN(Number(id_transporte))) {
        return res.status(400).json({
            error: 'El campo "id_transporte" es obligatorio y debe ser numérico'
        });
    }
    if (!fecha_despacho || isNaN(Date.parse(fecha_despacho))) {
        return res.status(400).json({
            error: 'El campo "fecha_despacho" es obligatorio y debe ser una fecha válida'
        });
    }
    if (!hora_salida || typeof hora_salida !== "string") {
        return res.status(400).json({
            error: 'El campo "hora_salida" es obligatorio (formato HH:MM o HH:MM:SS)'
        });
    }
    if (!id_cc || isNaN(Number(id_cc))) {
        return res.status(400).json({
            error: 'El campo "id_cc" (cedis-cliente) es obligatorio y debe ser numérico'
        });
    }
    if (
        !orden_venta ||
        typeof orden_venta !== "string" ||
        orden_venta.trim() === "" ||
        orden_venta.length > 50
    ) {
        return res.status(400).json({
            error: 'El campo "orden_venta" es obligatorio, debe ser texto y máximo 50 caracteres'
        });
    }
    if (
        !cita ||
        typeof cita !== "string" ||
        cita.trim() === "" ||
        cita.length > 50
    ) {
        return res.status(400).json({
            error: 'El campo "cita" es obligatorio, debe ser texto y máximo 50 caracteres'
        });
    }
    if (!fecha_cita || isNaN(Date.parse(fecha_cita))) {
        return res.status(400).json({
            error: 'El campo "fecha_cita" es obligatorio y debe ser una fecha válida'
        });
    }
    if (
        temperatura_salida === undefined ||
        temperatura_salida === null ||
        isNaN(Number(temperatura_salida))
    ) {
        return res.status(400).json({
            error: 'El campo "temperatura_salida" es obligatorio y debe ser numérico'
        });
    }
    if (
        estado === undefined ||
        estado === null ||
        isNaN(Number(estado))
    ) {
        return res.status(400).json({
            error: 'El campo "estado" es obligatorio y debe ser numérico'
        });
    }
    if (
        !observaciones ||
        typeof observaciones !== "string" ||
        observaciones.trim() === "" ||
        observaciones.length > 250
    ) {
        return res.status(400).json({
            error: 'El campo "observaciones" es obligatorio, debe ser texto y máximo 250 caracteres'
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
