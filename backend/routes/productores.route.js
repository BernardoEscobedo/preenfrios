import { Router } from "express";
import { productoresController } from "../controllers/productores.controller.js";
import {
    validarProductor,
    validarIdProductor
} from "../middlewares/productores.middleware.js";


const router = Router();


// Obtener productores
router.get(
    "/productores",
    productoresController.getProductores
);


// Obtener productor por ID
router.get(
    "/productor/:id",
    validarIdProductor,
    productoresController.getProductorById
);


// Registrar productor
router.post(
    "/registrarproductor",
    validarProductor,
    productoresController.createProductor
);


// Actualizar productor
router.put(
    "/actualizarproductor/:id",
    validarIdProductor,
    validarProductor,
    productoresController.updateProductor
);


// Eliminar productor
router.delete(
    "/eliminarproductor/:id",
    validarIdProductor,
    productoresController.deleteProductor
);


export default router;
