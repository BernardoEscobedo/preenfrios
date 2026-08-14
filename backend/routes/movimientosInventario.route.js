import { Router } from "express";
import { movimientosInventarioController } from "../controllers/movimientosInventario.controller.js";
import { validarMovimiento, validarIdMovimiento } from "../middlewares/movimientosInventario.middleware.js";
import { verifyToken, verifyAdmin, verifyOperativo, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/movimientos", verifyToken, movimientosInventarioController.getMovimientos);

// GET por id
router.get("/movimiento/:id", verifyToken, validarIdMovimiento, movimientosInventarioController.getMovimientoById);

// GET por lote (trazabilidad)
router.get("/lote/:id_lote", verifyToken, movimientosInventarioController.getMovimientosByLote);

// POST crear (el trigger sincroniza ocupaciones_camaras)
router.post("/registrarmovimiento", verifyToken, validarMovimiento, movimientosInventarioController.createMovimiento);

// DELETE (corrección de captura; no revierte ocupación automáticamente)
router.delete("/eliminarmovimiento/:id", verifyToken, verifyAdmin, validarIdMovimiento, movimientosInventarioController.deleteMovimiento);

export default router;
