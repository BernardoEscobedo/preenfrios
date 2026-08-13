import { Router } from "express";
import { lotesController } from "../controllers/lotes.controller.js";
import {
    validarLote,
    validarIdLote
} from "../middlewares/lotes.middleware.js";


const router = Router();


// Obtener lotes
router.get(
    "/lotes",
    lotesController.getLotes
);


// Obtener lote por ID
router.get(
    "/lote/:id",
    validarIdLote,
    lotesController.getLoteById
);


// Obtener lotes por finca
router.get(
    "/finca/:id_finca",
    lotesController.getLotesByFinca
);


// Registrar lote
router.post(
    "/registrarlote",
    validarLote,
    lotesController.createLote
);


// Actualizar lote
router.put(
    "/actualizarlote/:id",
    validarIdLote,
    validarLote,
    lotesController.updateLote
);


// Eliminar lote
router.delete(
    "/eliminarlote/:id",
    validarIdLote,
    lotesController.deleteLote
);


export default router;
