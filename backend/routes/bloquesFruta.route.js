import { Router } from "express";
import { bloquesFrutaController } from "../controllers/bloquesFruta.controller.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";
import { validarBloque, validarIdBloque } from "../middlewares/bloquesFruta.middleware.js";

const router = Router();

// Obtener bloques
router.get("/bloques", verifyToken, bloquesFrutaController.getBloques);

// Obtener bloque por ID
router.get("/bloque/:id", verifyToken, validarIdBloque, bloquesFrutaController.getBloqueById);

// Obtener bloque con su detalle de lotes (composición)
router.get("/bloque/:id/detalle", verifyToken, validarIdBloque, bloquesFrutaController.getBloqueConDetalle);

// Registrar bloque
router.post("/registrarbloque", verifyToken, validarBloque, bloquesFrutaController.createBloque);

// Actualizar bloque
router.put("/actualizarbloque/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdBloque, validarBloque, bloquesFrutaController.updateBloque);

// Eliminar bloque
router.delete("/eliminarbloque/:id", verifyToken, verifyAdmin, verifyCoordinador, validarIdBloque, bloquesFrutaController.deleteBloque);

export default router;
