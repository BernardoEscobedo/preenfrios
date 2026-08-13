import { Router } from "express";
import { mantenimientosController } from "../controllers/mantenimientos.controller.js";
import {
    validarMantenimiento,
    validarIdMantenimiento,
    validarIdCamaraParam
} from "../middlewares/mantenimientos.middleware.js";


const router = Router();


// Obtener mantenimientos
router.get(
    "/mantenimientos",
    mantenimientosController.getMantenimientos
);


// Obtener mantenimiento por ID
router.get(
    "/mantenimiento/:id_mantenimiento",
    validarIdMantenimiento,
    mantenimientosController.getMantenimientoById
);


// Obtener mantenimientos por cámara
router.get(
    "/camara/:id_camara",
    validarIdCamaraParam,
    mantenimientosController.getMantenimientosByCamara
);


// Registrar mantenimiento
router.post(
    "/registrarmantenimiento",
    validarMantenimiento,
    mantenimientosController.createMantenimiento
);


// Actualizar mantenimiento
router.put(
    "/actualizarmantenimiento/:id_mantenimiento",
    validarIdMantenimiento,
    validarMantenimiento,
    mantenimientosController.updateMantenimiento
);


// Eliminar mantenimiento
router.delete(
    "/eliminarmantenimiento/:id_mantenimiento",
    validarIdMantenimiento,
    mantenimientosController.deleteMantenimiento
);


export default router;
