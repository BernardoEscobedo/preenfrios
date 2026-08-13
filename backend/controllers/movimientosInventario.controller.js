import movimientosInventarioModel from "../models/movimientosInventario.model.js";

// GET /api/preenfrio/movimientos/movimientos
const getMovimientos = async (req, res) => {
    try {
        const movimientos = await movimientosInventarioModel.getMovimientos();
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos de inventario"
        });
    }
};

// GET /api/preenfrio/movimientos/movimiento/:id
const getMovimientoById = async (req, res) => {
    try {
        const { id } = req.params;
        const movimiento =
            await movimientosInventarioModel.getMovimientoById(id);
        if (!movimiento) {
            return res.status(404).json({
                error: "Movimiento no encontrado"
            });
        }
        res.status(200).json(movimiento);
    } catch (error) {
        console.error("Error al obtener movimiento:", error);
        res.status(500).json({
            error: "Error al obtener el movimiento"
        });
    }
};

// GET /api/preenfrio/movimientos/lote/:id_lote
const getMovimientosByLote = async (req, res) => {
    try {
        const { id_lote } = req.params;
        if (!id_lote || isNaN(Number(id_lote))) {
            return res.status(400).json({
                error: "El id de lote debe ser un número válido"
            });
        }
        const movimientos =
            await movimientosInventarioModel.getMovimientosByLote(id_lote);
        res.status(200).json(movimientos);
    } catch (error) {
        console.error("Error al obtener movimientos del lote:", error);
        res.status(500).json({
            error: "Error al obtener los movimientos del lote"
        });
    }
};

// POST /api/preenfrio/movimientos/registrarmovimiento
const createMovimiento = async (req, res) => {
    try {
        const nuevoMovimiento =
            await movimientosInventarioModel.createMovimiento(req.body);
        res.status(201).json(nuevoMovimiento);
    } catch (error) {
        console.error("Error al crear movimiento:", error);
        if (error.code === "23503") {
            return res.status(409).json({
                error: "El lote, cámara, despacho o usuario indicado no existe"
            });
        }
        res.status(500).json({
            error: "Error al crear el movimiento de inventario"
        });
    }
};

// DELETE /api/preenfrio/movimientos/eliminarmovimiento/:id
const deleteMovimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado =
            await movimientosInventarioModel.deleteMovimiento(id);
        if (!eliminado) {
            return res.status(404).json({
                error: "Movimiento no encontrado"
            });
        }
        res.status(200).json({
            mensaje: "Movimiento eliminado correctamente",
            aviso: "El trigger NO revierte la ocupación de cámara; ajusta ocupaciones_camaras manualmente si aplica.",
            movimiento: eliminado
        });
    } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        res.status(500).json({
            error: "Error al eliminar el movimiento"
        });
    }
};

export const movimientosInventarioController = {
    getMovimientos,
    getMovimientoById,
    getMovimientosByLote,
    createMovimiento,
    deleteMovimiento
};
