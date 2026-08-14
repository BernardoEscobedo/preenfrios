import { Router } from "express";
import { movimientosInventarioController } from "../controllers/movimientosInventario.controller.js";
import { validarMovimiento, validarIdMovimiento } from "../middlewares/movimientosInventario.middleware.js";
import { verifyToken, verifyAdmin, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Módulo OPERATIVO (inventarios): ver/crear = operativo+, eliminar = admin
// (no hay edición: los movimientos son bitácora inmutable)

// GET todos (ver)
router.get("/movimientos", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientos);
// GET por id (ver)
router.get("/movimiento/:id", verifyToken, verifyOperativo, validarIdMovimiento, movimientosInventarioController.getMovimientoById);
// GET por lote (trazabilidad) (ver)
router.get("/lote/:id_lote", verifyToken, verifyOperativo, movimientosInventarioController.getMovimientosByLote);
// POST crear (crear) -> el trigger sincroniza ocupaciones_camaras
router.post("/registrarmovimiento", verifyToken, verifyOperativo, validarMovimiento, movimientosInventarioController.createMovimiento);
// DELETE (eliminar) -> corrección de captura; solo admin
router.delete("/eliminarmovimiento/:id", verifyToken, verifyAdmin, validarIdMovimiento, movimientosInventarioController.deleteMovimiento);

export default router;
