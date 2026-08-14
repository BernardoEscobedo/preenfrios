import { Router } from "express";
import { transportesController } from "../controllers/transportes.controller.js";
import { validarTransporte, validarIdTransporte } from "../middlewares/transportes.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/transportes", verifyToken, transportesController.getTransportes);

// GET por id
router.get("/transporte/:id_transporte", verifyToken, validarIdTransporte, transportesController.getTransporteById);

// POST crear
router.post("/registrartransporte", verifyToken, validarTransporte, transportesController.createTransporte);

// PUT actualizar
router.put("/actualizartransporte/:id_transporte", validarIdTransporte, validarTransporte, verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor, transportesController.updateTransporte);

// DELETE eliminar
router.delete( "/eliminartransporte/:id_transporte", verifyToken, verifyAdmin, verifyCoordinador, validarIdTransporte, transportesController.deleteTransporte);

export default router;
