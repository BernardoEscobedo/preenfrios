import { Router } from "express";
import { skuPtController } from "../controllers/skuPt.controller.js";
import {
    validarSkuPt,
    validarIdSkuPt
} from "../middlewares/skuPt.middleware.js";


const router = Router();


// Obtener SKU
router.get(
    "/skupt",
    skuPtController.getSkuPt
);


// Obtener SKU por ID
router.get(
    "/sku/:id",
    validarIdSkuPt,
    skuPtController.getSkuPtById
);


// Registrar SKU
router.post(
    "/registrarsku",
    validarSkuPt,
    skuPtController.createSkuPt
);


// Actualizar SKU
router.put(
    "/actualizarsku/:id",
    validarIdSkuPt,
    validarSkuPt,
    skuPtController.updateSkuPt
);


// Eliminar SKU
router.delete(
    "/eliminarsku/:id",
    validarIdSkuPt,
    skuPtController.deleteSkuPt
);


export default router;
