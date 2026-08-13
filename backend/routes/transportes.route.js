import { Router } from "express";
import { transportesController } from "../controllers/transportes.controller.js";
import {
    validarTransporte,
    validarIdTransporte
} from "../middlewares/transportes.middleware.js";
// import { verifyToken, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/transportes", transportesController.getTransportes);

// GET por id
router.get(
    "/transporte/:id_transporte",
    validarIdTransporte,
    transportesController.getTransporteById
);

// POST crear
router.post(
    "/registrartransporte",
    validarTransporte,
    transportesController.createTransporte
);

// PUT actualizar
router.put(
    "/actualizartransporte/:id_transporte",
    validarIdTransporte,
    validarTransporte,
    transportesController.updateTransporte
);

// DELETE eliminar
router.delete(
    "/eliminartransporte/:id_transporte",
    validarIdTransporte,
    transportesController.deleteTransporte
);

export default router;
