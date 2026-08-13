import despachosModel from "../models/despachos.model.js";

// GET /api/preenfrio/despachos/despachos
const getDespachos = async (req, res) => {
    try {
        const despachos = await despachosModel.getDespachos();
        res.status(200).json(despachos);
    } catch (error) {
        console.error("Error al obtener despachos:", error);
        res.status(500).json({
            error: "Error al obtener los despachos"
        });
    }
};

// GET /api/preenfrio/despachos/despacho/:id
const getDespachoById = async (req, res) => {
    try {
        const { id } = req.params;
        const despacho = await despachosModel.getDespachoById(id);
        if (!despacho) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(despacho);
    } catch (error) {
        console.error("Error al obtener despacho:", error);
        res.status(500).json({
            error: "Error al obtener el despacho"
        });
    }
};

// GET /api/preenfrio/despachos/despacho/:id/detalle
const getDespachoConDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const despacho = await despachosModel.getDespachoConDetalle(id);
        if (!despacho) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(despacho);
    } catch (error) {
        console.error("Error al obtener el despacho con detalle:", error);
        res.status(500).json({
            error: "Error al obtener el despacho con su detalle"
        });
    }
};

// POST /api/preenfrio/despachos/registrardespacho
const createDespacho = async (req, res) => {
    try {
        const nuevoDespacho = await despachosModel.createDespacho(req.body);
        res.status(201).json(nuevoDespacho);
    } catch (error) {
        console.error("Error al crear despacho:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un despacho con ese folio"
            });
        }
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El transporte, cliente, bloque o lote indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al crear el despacho"
        });
    }
};

// POST /api/preenfrio/despachos/despacho/:id/detalle
const addDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const linea = await despachosModel.addDetalle(id, req.body);
        res.status(201).json(linea);
    } catch (error) {
        console.error("Error al agregar detalle de despacho:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El despacho, bloque o lote indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al agregar el detalle del despacho"
        });
    }
};

// PUT /api/preenfrio/despachos/actualizardespacho/:id
const updateDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const despachoActualizado = await despachosModel.updateDespacho(
            id,
            req.body
        );
        if (!despachoActualizado) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json(despachoActualizado);
    } catch (error) {
        console.error("Error al actualizar despacho:", error);
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe un despacho con ese folio"
            });
        }
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El transporte o cliente indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al actualizar el despacho"
        });
    }
};

// DELETE /api/preenfrio/despachos/detalle/:id_detalle
const deleteDetalle = async (req, res) => {
    try {
        const { id_detalle } = req.params;
        const eliminado = await despachosModel.deleteDetalle(id_detalle);
        if (!eliminado) {
            return res.status(404).json({
                error: "Línea de detalle no encontrada"
            });
        }
        res.status(200).json({
            mensaje: "Detalle eliminado correctamente",
            detalle: eliminado
        });
    } catch (error) {
        console.error("Error al eliminar detalle de despacho:", error);
        res.status(500).json({
            error: "Error al eliminar el detalle del despacho"
        });
    }
};

// DELETE /api/preenfrio/despachos/eliminardespacho/:id
const deleteDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const despachoEliminado = await despachosModel.deleteDespacho(id);
        if (!despachoEliminado) {
            return res.status(404).json({
                error: "Despacho no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Despacho eliminado correctamente",
            despacho: despachoEliminado
        });
    } catch (error) {
        console.error("Error al eliminar despacho:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "No se puede eliminar: el despacho está referenciado en movimientos de inventario"
            });
        }
        res.status(500).json({
            error: "Error al eliminar el despacho"
        });
    }
};

export const despachosController = {
    getDespachos,
    getDespachoById,
    getDespachoConDetalle,
    createDespacho,
    addDetalle,
    updateDespacho,
    deleteDetalle,
    deleteDespacho
};
