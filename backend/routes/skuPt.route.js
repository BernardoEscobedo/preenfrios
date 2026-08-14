import { Router } from "express";
import { skuPtController } from "../controllers/skuPt.controller.js";
import { validarSkuPt, validarIdSkuPt } from "../middlewares/skuPt.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador, verifySupervisor, verifyOperativo } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Obtener SKU
router.get("/skupt", verifyToken, skuPtController.getSkuPt);

// Obtener SKU por ID
router.get("/sku/:id", verifyToken, validarIdSkuPt, skuPtController.getSkuPtById);

// Registrar SKU
router.post("/registrarsku", verifyToken, verifyAdmin, verifyCoordinador, validarSkuPt, skuPtController.createSkuPt);

// Actualizar SKU
router.put("/actualizarsku/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdSkuPt, validarSkuPt, skuPtController.updateSkuPt);

// Eliminar SKU
router.delete( "/eliminarsku/:id", verifyToken, verifyAdmin, validarIdSkuPt, skuPtController.deleteSkuPt);

export default router;
