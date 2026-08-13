import { Router } from "express";
import { ocupacionesController } from "../controllers/ocupaciones.controller.js";
import {
    validarOcupacion,
    validarCierreOcupacion,
    validarIdOcupacion,
    validarIdCamaraParam
} from "../middlewares/ocupaciones.middleware.js";


const router = Router();


// Obtener ocupaciones
router.get(
    "/ocupaciones",
    ocupacionesController.getOcupaciones
);


// Obtener ocupaciones activas
router.get(
    "/activas",
    ocupacionesController.getOcupacionesActivas
);


// Obtener ocupación por ID
router.get(
    "/ocupacion/:id_ocupacion",
    validarIdOcupacion,
    ocupacionesController.getOcupacionById
);


// Obtener ocupaciones por cámara
router.get(
    "/camara/:id_camara",
    validarIdCamaraParam,
    ocupacionesController.getOcupacionesByCamara
);


// Registrar ocupación
router.post(
    "/registrarocupacion",
    validarOcupacion,
    ocupacionesController.createOcupacion
);


// Actualizar ocupación
router.put(
    "/actualizarocupacion/:id_ocupacion",
    validarIdOcupacion,
    validarOcupacion,
    ocupacionesController.updateOcupacion
);


// Cerrar ocupación
router.patch(
    "/cerrarocupacion/:id_ocupacion",
    validarIdOcupacion,
    validarCierreOcupacion,
    ocupacionesController.cerrarOcupacion
);


// Eliminar ocupación
router.delete(
    "/eliminarocupacion/:id_ocupacion",
    validarIdOcupacion,
    ocupacionesController.deleteOcupacion
);


export default router;
