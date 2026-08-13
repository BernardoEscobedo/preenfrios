import { Router } from "express";
import { movimientosInventarioController } from "../controllers/movimientosInventario.controller.js";
import {
    validarMovimiento,
    validarIdMovimiento
} from "../middlewares/movimientosInventario.middleware.js";
// import { verifyToken, verifyOperativo, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/movimientos", movimientosInventarioController.getMovimientos);

// GET por id
router.get(
    "/movimiento/:id",
    validarIdMovimiento,
    movimientosInventarioController.getMovimientoById
);

// GET por lote (trazabilidad)
router.get(
    "/lote/:id_lote",
    movimientosInventarioController.getMovimientosByLote
);

// POST crear (el trigger sincroniza ocupaciones_camaras)
router.post(
    "/registrarmovimiento",
    validarMovimiento,
    movimientosInventarioController.createMovimiento
);

// DELETE (corrección de captura; no revierte ocupación automáticamente)
router.delete(
    "/eliminarmovimiento/:id",
    validarIdMovimiento,
    movimientosInventarioController.deleteMovimiento
);

export default router;
