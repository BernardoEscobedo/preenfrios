import { Router } from "express";
import { empleadosController } from "../controllers/empleados.controller.js";
import { validarEmpleado, validarIdEmpleado } from "../middlewares/empleados.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

// Obtener empleados
router.get("/empleados", verifyToken, verifyAdmin, verifyCoordinador, empleadosController.getEmpleados);

// Obtener empleado por ID
router.get("/empleado/:id_empleado", verifyToken, verifyAdmin, verifyCoordinador, validarIdEmpleado, empleadosController.getEmpleadoById);

// Registrar empleado
router.post("/registrarempleado", verifyToken, verifyAdmin, verifyCoordinador, validarEmpleado, empleadosController.createEmpleado);

// Actualizar empleado
router.put("/actualizarempleado/:id_empleado", verifyToken, verifyAdmin, verifyCoordinador, validarIdEmpleado, validarEmpleado, empleadosController.updateEmpleado);

// Eliminar empleado
router.delete("/eliminarempleado/:id_empleado", verifyToken, verifyAdmin, validarIdEmpleado, empleadosController.deleteEmpleado);

export default router;