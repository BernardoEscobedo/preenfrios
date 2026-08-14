import { Router } from "express";
import { productoresController } from "../controllers/productores.controller.js";
import { validarProductor, validarIdProductor } from "../middlewares/productores.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Obtener productores
router.get("/productores", verifyToken, productoresController.getProductores);

// Obtener productor por ID
router.get("/productor/:id", verifyToken, validarIdProductor, productoresController.getProductorById);

// Registrar productor
router.post("/registrarproductor", verifyToken, verifyAdmin, verifyCoordinador, validarProductor, productoresController.createProductor);

// Actualizar productor
router.put("/actualizarproductor/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdProductor, validarProductor, productoresController.updateProductor);

// Eliminar productor
router.delete("/eliminarproductor/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdProductor, productoresController.deleteProductor);

export default router;
