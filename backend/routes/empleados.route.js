import { Router } from "express";
import { empleadosController } from "../controllers/empleados.controller.js";
import {
    validarEmpleado,
    validarIdEmpleado
} from "../middlewares/empleados.middleware.js";


const router = Router();


// Obtener empleados
router.get(
    "/empleados",
    empleadosController.getEmpleados
);


// Obtener empleado por ID
router.get(
    "/empleado/:id_empleado",
    validarIdEmpleado,
    empleadosController.getEmpleadoById
);


// Registrar empleado
router.post(
    "/registrarempleado",
    validarEmpleado,
    empleadosController.createEmpleado
);


// Actualizar empleado
router.put(
    "/actualizarempleado/:id_empleado",
    validarIdEmpleado,
    validarEmpleado,
    empleadosController.updateEmpleado
);


// Eliminar empleado
router.delete(
    "/eliminarempleado/:id_empleado",
    validarIdEmpleado,
    empleadosController.deleteEmpleado
);


export default router;