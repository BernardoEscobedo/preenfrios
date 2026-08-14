import { Router } from "express";
import { bloquesLoteDetalleController } from "../controllers/bloquesLoteDetalle.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";
import { validarDetalle, validarActualizarDetalle, validarIdDetalle } from "../middlewares/bloquesLoteDetalle.middleware.js";

const router = Router();

// Obtener todo el detalle
router.get("/detalles", verifyToken, bloquesLoteDetalleController.getDetalles);


// Obtener detalle por ID
router.get("/detalle/:id", verifyToken, validarIdDetalle, bloquesLoteDetalleController.getDetalleById);

// Obtener composición (detalle) de un bloque
router.get("/bloque/:id_bloque", verifyToken, bloquesLoteDetalleController.getDetallesByBloque);

// Obtener en qué bloques aparece un lote
router.get("/lote/:id_lote", verifyToken, bloquesLoteDetalleController.getDetallesByLote);

// Registrar detalle (agregar lote a un bloque)
router.post("/registrardetalle", verifyToken, validarDetalle, bloquesLoteDetalleController.createDetalle);

// Actualizar detalle (corregir tarimas/cajas de ese lote en el bloque)
router.put("/actualizardetalle/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdDetalle, validarActualizarDetalle, bloquesLoteDetalleController.updateDetalle);

// Eliminar detalle (quitar lote del bloque)
router.delete("/eliminardetalle/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdDetalle, bloquesLoteDetalleController.deleteDetalle);

export default router;
