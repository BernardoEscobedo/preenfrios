import recepcionesModel from "../models/recepciones.model.js";

// =========================================================
// RECEPCIONES ESPERADAS (vista) — lo que el preenfrío espera recibir
// =========================================================

// GET /api/preenfrio/recepciones/esperadas
const getRecepcionesEsperadas = async (req, res) => {
    try {
        const data = await recepcionesModel.getRecepcionesEsperadas();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones esperadas:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones esperadas"
        });
    }
};

// GET /api/preenfrio/recepciones/esperadas/semana/:semana
const getRecepcionesEsperadasBySemana = async (req, res) => {
    try {
        const { semana } = req.params;
        if (!semana || isNaN(Number(semana))) {
            return res.status(400).json({
                error: "La semana debe ser un número válido"
            });
        }
        const data = await recepcionesModel.getRecepcionesEsperadasBySemana(
            semana
        );
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones esperadas por semana:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones esperadas de la semana"
        });
    }
};

// GET /api/preenfrio/recepciones/pendientes
const getPendientes = async (req, res) => {
    try {
        const data = await recepcionesModel.getPendientes();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener pendientes:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones pendientes"
        });
    }
};

// =========================================================
// RECEPCIONES (registros reales)
// =========================================================

// GET /api/preenfrio/recepciones/recepciones
const getRecepciones = async (req, res) => {
    try {
        const recepciones = await recepcionesModel.getRecepciones();
        res.status(200).json(recepciones);
    } catch (error) {
        console.error("Error al obtener recepciones:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones"
        });
    }
};

// GET /api/preenfrio/recepciones/recepcion/:id
const getRecepcionById = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcion = await recepcionesModel.getRecepcionById(id);
        if (!recepcion) {
            return res.status(404).json({
                error: "Recepción no encontrada"
            });
        }
        res.status(200).json(recepcion);
    } catch (error) {
        console.error("Error al obtener recepcion:", error);
        res.status(500).json({
            error: "Error al obtener la recepcion"
        });
    }
};

// GET /api/preenfrio/recepciones/produccion/:id_produccion
const getRecepcionesByProduccion = async (req, res) => {
    try {
        const { id_produccion } = req.params;
        if (!id_produccion || isNaN(Number(id_produccion))) {
            return res.status(400).json({
                error: "El id de producción debe ser un número válido"
            });
        }
        const data = await recepcionesModel.getRecepcionesByProduccion(
            id_produccion
        );
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener recepciones de la produccion:", error);
        res.status(500).json({
            error: "Error al obtener las recepciones de la produccion"
        });
    }
};

// POST /api/preenfrio/recepciones/registrarrecepcion
const createRecepcion = async (req, res) => {
    try {
        // El id_usuario se toma del token (lo pone verifyToken); si no,
        // se acepta del body como respaldo.
        const id_usuario =
            req.id_usuario ?? req.usuario?.id_usuario ?? req.body.id_usuario ?? null;

        const nuevaRecepcion = await recepcionesModel.createRecepcion({
            ...req.body,
            id_usuario
        });
        res.status(201).json(nuevaRecepcion);
    } catch (error) {
        console.error("Error al crear recepcion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La producción, cámara o usuario indicados no existen"
            });
        }
        if (error.code === "23505") {
            // Choca con el índice único de ocupación activa por cámara
            return res.status(409).json({
                error: "La cámara ya tiene una ocupación de inventario activa"
            });
        }
        res.status(500).json({
            error: "Error al crear la recepcion"
        });
    }
};

// PUT /api/preenfrio/recepciones/actualizarrecepcion/:id
const updateRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionActualizada = await recepcionesModel.updateRecepcion(
            id,
            req.body
        );
        if (!recepcionActualizada) {
            return res.status(404).json({
                error: "Recepción no encontrada"
            });
        }
        res.status(200).json(recepcionActualizada);
    } catch (error) {
        console.error("Error al actualizar recepcion:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "La cámara indicada no existe"
            });
        }
        res.status(500).json({
            error: "Error al actualizar la recepcion"
        });
    }
};

// PATCH /api/preenfrio/recepciones/cancelarrecepcion/:id
const cancelarRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionCancelada = await recepcionesModel.cancelarRecepcion(id);
        if (!recepcionCancelada) {
            return res.status(404).json({
                error: "Recepción no encontrada"
            });
        }
        res.status(200).json({
            mensaje: "Recepción cancelada correctamente",
            recepcion: recepcionCancelada
        });
    } catch (error) {
        console.error("Error al cancelar recepcion:", error);
        res.status(500).json({
            error: "Error al cancelar la recepcion"
        });
    }
};

// DELETE /api/preenfrio/recepciones/eliminarrecepcion/:id
const deleteRecepcion = async (req, res) => {
    try {
        const { id } = req.params;
        const recepcionEliminada = await recepcionesModel.deleteRecepcion(id);
        if (!recepcionEliminada) {
            return res.status(404).json({
                error: "Recepción no encontrada"
            });
        }
        res.status(200).json({
            mensaje: "Recepción eliminada correctamente",
            recepcion: recepcionEliminada
        });
    } catch (error) {
        console.error("Error al eliminar recepcion:", error);
        res.status(500).json({
            error: "Error al eliminar la recepcion"
        });
    }
};

export const recepcionesController = {
    getRecepcionesEsperadas,
    getRecepcionesEsperadasBySemana,
    getPendientes,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    createRecepcion,
    updateRecepcion,
    cancelarRecepcion,
    deleteRecepcion
};
