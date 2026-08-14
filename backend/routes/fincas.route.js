import { Router } from "express";
import { fincasController } from "../controllers/fincas.controller.js";
import { validarFinca, validarIdFinca } from "../middlewares/fincas.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Obtener fincas
router.get("/fincas", verifyToken, fincasController.getFincas);

// Obtener finca por ID
router.get("/finca/:id", verifyToken, validarIdFinca, fincasController.getFincaById);

// Obtener fincas por productor
router.get("/productor/:id_productor", verifyToken, fincasController.getFincasByProductor);

// Registrar finca
router.post("/registrarfinca", verifyToken, validarFinca, fincasController.createFinca);

// Actualizar finca
router.put("/actualizarfinca/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdFinca, validarFinca, fincasController.updateFinca);

// Eliminar finca
router.delete( "/eliminarfinca/:id", verifyToken, verifyAdmin, validarIdFinca, fincasController.deleteFinca);

export default router;
