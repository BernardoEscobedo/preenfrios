import { Router } from "express";
import { empleadosController } from "../controllers/empleados.controller.js";
import {
    validarEmpleado,
    validarIdEmpleado
} from "../middlewares/empleados.middleware.js";

const router = Router();

// GET /api/empleados
router.get("/", empleadosController.getEmpleados);

// GET /api/empleados/:id
router.get(
    "/:id",
    validarIdEmpleado,
    empleadosController.getEmpleadoById
);

// POST /api/empleados
router.post(
    "/",
    validarEmpleado,
    empleadosController.createEmpleado
);

// PUT /api/empleados/:id
router.put(
    "/:id",
    validarIdEmpleado,
    validarEmpleado,
    empleadosController.updateEmpleado
);

// DELETE /api/empleados/:id
router.delete(
    "/:id",
    validarIdEmpleado,
    empleadosController.deleteEmpleado
);

export default router;