import { Router } from "express";
import { camarasController } from "../controllers/camaras.controller.js";
import {
    validarCamara,
    validarIdCamara
} from "../middlewares/camaras.middleware.js";


const router = Router();


// Obtener camaras
router.get(
    "/camaras",
    camarasController.getCamaras
);


// Obtener camara por ID
router.get(
    "/camara/:id_camara",
    validarIdCamara,
    camarasController.getCamaraById
);


// Registrar camara
router.post(
    "/registrarcamara",
    validarCamara,
    camarasController.createCamara
);


// Actualizar camara
router.put(
    "/actualizarcamara/:id_camara",
    validarIdCamara,
    validarCamara,
    camarasController.updateCamara
);


// Eliminar camara
router.delete(
    "/eliminarcamara/:id_camara",
    validarIdCamara,
    camarasController.deleteCamara
);


export default router;
