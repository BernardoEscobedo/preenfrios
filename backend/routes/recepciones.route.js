import { Router } from "express";
import { recepcionesController } from "../controllers/recepciones.controller.js";
import { validarRecepcion, validarIdRecepcion } from "../middlewares/recepciones.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin

// ----- Consultas de la vista (lo que el preenfrío espera recibir) -----
// Recepciones esperadas (producción vs. recibido vs. pendiente)
router.get("/esperadas", verifyToken, verifySupervisor, recepcionesController.getRecepcionesEsperadas);
// Recepciones esperadas por semana
router.get("/esperadas/semana/:semana", verifyToken, verifySupervisor, recepcionesController.getRecepcionesEsperadasBySemana);
// Solo lo pendiente por recibir (y que sí se preenfría)
router.get("/pendientes", verifyToken, verifySupervisor, recepcionesController.getPendientes);

// ----- Recepciones (registros reales) -----
// Listar recepciones
router.get("/recepciones", verifyToken, verifySupervisor, recepcionesController.getRecepciones);
// Recepción por ID
router.get("/recepcion/:id", verifyToken, verifySupervisor, validarIdRecepcion, recepcionesController.getRecepcionById);
// Recepciones de una producción
router.get("/produccion/:id_produccion", verifyToken, verifySupervisor, recepcionesController.getRecepcionesByProduccion);

// Registrar recepción (crear) -> ocupa la cámara vía trigger
router.post("/registrarrecepcion", verifyToken, verifySupervisor, validarRecepcion, recepcionesController.createRecepcion);

// Actualizar recepción (editar)
router.put("/actualizarrecepcion/:id", verifyToken, verifyCoordinador, validarIdRecepcion, validarRecepcion, recepcionesController.updateRecepcion);

// Cancelar recepción (editar) -> estado = 0
router.patch("/cancelarrecepcion/:id", verifyToken, verifyCoordinador, validarIdRecepcion, recepcionesController.cancelarRecepcion);

// Eliminar recepción (eliminar)
router.delete("/eliminarrecepcion/:id", verifyToken, verifyAdmin, validarIdRecepcion, recepcionesController.deleteRecepcion);

export default router;
