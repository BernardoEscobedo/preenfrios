import { Router } from "express";
import { cedisClienteController } from "../controllers/cedisCliente.controller.js";
import { validarCedisCliente, validarIdCedisCliente } from "../middlewares/cedisCliente.middleware.js";
import { verifyToken, verifyAdmin, verifyCoordinador } from "../middlewares/jwt.middlewares.js";

const router = Router();

router.get("/cedisclientes", verifyToken, cedisClienteController.getCedisClientes);

router.get("/cediscliente/:id_cc", verifyToken, validarIdCedisCliente, cedisClienteController.getCedisClienteById);

router.post("/registrarcediscliente", verifyToken, verifyAdmin, verifyCoordinador, validarCedisCliente, cedisClienteController.createCedisCliente);

router.put("/actualizarcediscliente/:id_cc", verifyToken, verifyAdmin, verifyCoordinador, validarIdCedisCliente, validarCedisCliente, cedisClienteController.updateCedisCliente);

router.delete("/eliminarcediscliente/:id_cc", verifyToken, verifyAdmin, verifyCoordinador, validarIdCedisCliente, cedisClienteController.deleteCedisCliente);

export default router;
