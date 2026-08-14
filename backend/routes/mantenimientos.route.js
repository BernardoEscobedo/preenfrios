import { Router } from "express";
import { mantenimientosController } from "../controllers/mantenimientos.controller.js";
import { validarMantenimiento, validarIdMantenimiento, validarIdCamaraParam } from "../middlewares/mantenimientos.middleware.js";
import { verifyToken, verifyAdmin, verifyOperativo, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Obtener mantenimientos
router.get("/mantenimientos", verifyToken, mantenimientosController.getMantenimientos);

// Obtener mantenimiento por ID
router.get("/mantenimiento/:id_mantenimiento", verifyToken, validarIdMantenimiento, mantenimientosController.getMantenimientoById);

// Obtener mantenimientos por cámara
router.get("/camara/:id_camara", verifyToken, validarIdCamaraParam, mantenimientosController.getMantenimientosByCamara);

// Registrar mantenimiento
router.post("/registrarmantenimiento", verifyToken, validarMantenimiento, mantenimientosController.createMantenimiento);

// Actualizar mantenimiento
router.put("/actualizarmantenimiento/:id_mantenimiento",  verifyToken, validarIdMantenimiento, validarMantenimiento, mantenimientosController.updateMantenimiento);

// Eliminar mantenimiento
router.delete("/eliminarmantenimiento/:id_mantenimiento", verifyAdmin, verifyCoordinador, verifyToken, validarIdMantenimiento, mantenimientosController.deleteMantenimiento);

export default router;
