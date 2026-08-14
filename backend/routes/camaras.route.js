import { Router } from "express";
import { camarasController } from "../controllers/camaras.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";
import { validarCamara, validarIdCamara } from "../middlewares/camaras.middleware.js";

const router = Router();

// Obtener camaras
router.get("/camaras", verifyToken, camarasController.getCamaras
);

// Obtener camara por ID
router.get("/camara/:id_camara", verifyToken, validarIdCamara, camarasController.getCamaraById);

// Registrar camara
router.post("/registrarcamara", verifyToken, verifyAdmin, verifyCoordinador, validarCamara, camarasController.createCamara);

// Actualizar camara
router.put("/actualizarcamara/:id_camara", verifyToken, verifyAdmin, verifyCoordinador, validarIdCamara, validarCamara, camarasController.updateCamara);

// Eliminar camara
router.delete("/eliminarcamara/:id_camara",
    verifyToken, verifyAdmin, verifyCoordinador, validarIdCamara, camarasController.deleteCamara);

export default router;
