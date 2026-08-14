import { Router } from "express";
import { lotesController } from "../controllers/lotes.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";
import { validarLote, validarIdLote } from "../middlewares/lotes.middleware.js";

const router = Router();

// Obtener lotes
router.get("/lotes", verifyToken, lotesController.getLotes);

// Obtener lote por ID
router.get("/lote/:id", verifyToken, validarIdLote, lotesController.getLoteById);

// Obtener lotes por finca
router.get("/finca/:id_finca", verifyToken, lotesController.getLotesByFinca);

// Registrar lote
router.post("/registrarlote", verifyToken, validarLote, lotesController.createLote);

// Actualizar lote
router.put("/actualizarlote/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdLote, validarLote, lotesController.updateLote);

// Eliminar lote
router.delete("/eliminarlote/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdLote, lotesController.deleteLote);

export default router;