import { Router } from "express";
import { cedisClienteController } from "../controllers/cedisCliente.controller.js";
import {
    validarCedisCliente,
    validarIdCedisCliente
} from "../middlewares/cedisCliente.middleware.js";
// import { verifyToken, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

router.get("/cedisclientes", cedisClienteController.getCedisClientes);

router.get(
    "/cediscliente/:id_cc",
    validarIdCedisCliente,
    cedisClienteController.getCedisClienteById
);

router.post(
    "/registrarcediscliente",
    validarCedisCliente,
    cedisClienteController.createCedisCliente
);

router.put(
    "/actualizarcediscliente/:id_cc",
    validarIdCedisCliente,
    validarCedisCliente,
    cedisClienteController.updateCedisCliente
);

router.delete(
    "/eliminarcediscliente/:id_cc",
    validarIdCedisCliente,
    cedisClienteController.deleteCedisCliente
);

export default router;
