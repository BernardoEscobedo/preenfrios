import { Router } from "express";
import { fincasController } from "../controllers/fincas.controller.js";
import {
    validarFinca,
    validarIdFinca
} from "../middlewares/fincas.middleware.js";


const router = Router();


// Obtener fincas
router.get(
    "/fincas",
    fincasController.getFincas
);


// Obtener finca por ID
router.get(
    "/finca/:id",
    validarIdFinca,
    fincasController.getFincaById
);


// Obtener fincas por productor
router.get(
    "/productor/:id_productor",
    fincasController.getFincasByProductor
);


// Registrar finca
router.post(
    "/registrarfinca",
    validarFinca,
    fincasController.createFinca
);


// Actualizar finca
router.put(
    "/actualizarfinca/:id",
    validarIdFinca,
    validarFinca,
    fincasController.updateFinca
);


// Eliminar finca
router.delete(
    "/eliminarfinca/:id",
    validarIdFinca,
    fincasController.deleteFinca
);


export default router;
