import { Router } from "express";
import { bloquesFrutaController } from "../controllers/bloquesFruta.controller.js";
import {
    validarBloque,
    validarIdBloque
} from "../middlewares/bloquesFruta.middleware.js";


const router = Router();


// Obtener bloques
router.get(
    "/bloques",
    bloquesFrutaController.getBloques
);


// Obtener bloque por ID
router.get(
    "/bloque/:id",
    validarIdBloque,
    bloquesFrutaController.getBloqueById
);


// Obtener bloque con su detalle de lotes (composición)
router.get(
    "/bloque/:id/detalle",
    validarIdBloque,
    bloquesFrutaController.getBloqueConDetalle
);


// Registrar bloque
router.post(
    "/registrarbloque",
    validarBloque,
    bloquesFrutaController.createBloque
);


// Actualizar bloque
router.put(
    "/actualizarbloque/:id",
    validarIdBloque,
    validarBloque,
    bloquesFrutaController.updateBloque
);


// Eliminar bloque
router.delete(
    "/eliminarbloque/:id",
    validarIdBloque,
    bloquesFrutaController.deleteBloque
);


export default router;
