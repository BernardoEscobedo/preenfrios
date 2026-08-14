import { Router } from "express";
import { despachosController } from "../controllers/despachos.controller.js";
import { validarDespacho, validarDetalle, validarIdDespacho, validarIdDetalle } from "../middlewares/despachos.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// GET todos
router.get("/despachos", verifyToken, despachosController.getDespachos);

// GET encabezado por id
router.get("/despacho/:id", verifyToken, validarIdDespacho, despachosController.getDespachoById);

// GET encabezado + detalle
router.get("/despacho/:id/detalle", verifyToken, validarIdDespacho, despachosController.getDespachoConDetalle);

// POST crear despacho (encabezado + detalle[] transaccional)
router.post("/registrardespacho", verifyToken, validarDespacho, despachosController.createDespacho);

// POST agregar una línea de detalle a un despacho existente
router.post("/despacho/:id/detalle", verifyToken, validarIdDespacho, validarDetalle, despachosController.addDetalle);

// PUT actualizar encabezado
router.put("/actualizardespacho/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdDespacho, validarDespacho, despachosController.updateDespacho);

// DELETE una línea de detalle
router.delete("/detalle/:id_detalle", verifyToken, verifyAdmin, verifyCoordinador, validarIdDetalle, despachosController.deleteDetalle);

// DELETE despacho completo (borra su detalle)
router.delete("/eliminardespacho/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdDespacho, despachosController.deleteDespacho);

export default router;
