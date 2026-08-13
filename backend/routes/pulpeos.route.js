import { Router } from "express";
import { pulpeosController } from "../controllers/pulpeos.controller.js";
import {
    validarPulpeo,
    validarDetallePulpeo,
    validarEvidencia,
    validarIdPulpeo,
    validarIdPulpeoDetalle
} from "../middlewares/pulpeos.middleware.js";
// import { verifyToken, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/pulpeos", pulpeosController.getPulpeos);

// GET encabezado por id
router.get("/pulpeo/:id", validarIdPulpeo, pulpeosController.getPulpeoById);

// GET encabezado + detalle + evidencia
router.get(
    "/pulpeo/:id/detalle",
    validarIdPulpeo,
    pulpeosController.getPulpeoConDetalle
);

// GET pulpeos por bloque
router.get("/bloque/:id_bloque", pulpeosController.getPulpeosByBloque);

// POST crear pulpeo (encabezado + detalle[] + evidencia[] transaccional)
router.post("/registrarpulpeo", validarPulpeo, pulpeosController.createPulpeo);

// POST agregar una línea de detalle a un pulpeo existente
router.post(
    "/pulpeo/:id/detalle",
    validarIdPulpeo,
    validarDetallePulpeo,
    pulpeosController.addDetalle
);

// POST agregar evidencia (foto) a una línea de detalle
router.post(
    "/detalle/:id_pulpeo_detalle/evidencia",
    validarIdPulpeoDetalle,
    validarEvidencia,
    pulpeosController.addEvidencia
);

// PUT actualizar encabezado
router.put(
    "/actualizarpulpeo/:id",
    validarIdPulpeo,
    validarPulpeo,
    pulpeosController.updatePulpeo
);

// DELETE pulpeo completo (borra detalle y evidencia)
router.delete(
    "/eliminarpulpeo/:id",
    validarIdPulpeo,
    pulpeosController.deletePulpeo
);

export default router;
