import { Router } from "express";
import { despachosController } from "../controllers/despachos.controller.js";
import { validarDespacho, validarDetalle, validarIdDespacho, validarIdDetalle } from "../middlewares/despachos.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor } from "../middlewares/jwt.middlewares.js";

const router = Router();

// CATÁLOGO/OP: ver/crear = supervisor+, editar = coordinador+, eliminar = admin
// (operativo NO captura despachos)

// GET todos (ver)
router.get("/despachos", verifyToken, verifySupervisor, despachosController.getDespachos);
// GET encabezado por id (ver)
router.get("/despacho/:id", verifyToken, verifySupervisor, validarIdDespacho, despachosController.getDespachoById);
// GET encabezado + detalle (ver)
router.get("/despacho/:id/detalle", verifyToken, verifySupervisor, validarIdDespacho, despachosController.getDespachoConDetalle);
// POST crear despacho (crear) -> era "cualquiera autenticado"; ahora supervisor+
router.post("/registrardespacho", verifyToken, verifySupervisor, validarDespacho, despachosController.createDespacho);
// POST agregar línea de detalle (crear)
router.post("/despacho/:id/detalle", verifyToken, verifySupervisor, validarIdDespacho, validarDetalle, despachosController.addDetalle);
// PUT actualizar encabezado (editar)
router.put("/actualizardespacho/:id", verifyToken, verifyCoordinador, validarIdDespacho, validarDespacho, despachosController.updateDespacho);
// DELETE una línea de detalle (eliminar)
router.delete("/detalle/:id_detalle", verifyToken, verifyAdmin, validarIdDetalle, despachosController.deleteDetalle);
// DELETE despacho completo (eliminar)
router.delete("/eliminardespacho/:id", verifyToken, verifyAdmin, validarIdDespacho, despachosController.deleteDespacho);

export default router;
