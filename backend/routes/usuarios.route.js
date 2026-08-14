import { Router } from "express";
import { usuariosController } from "../controllers/usuarios.controller.js"
import { verifyAdmin,verifyCoordinador,verifyToken } from "../middlewares/jwt.middlewares.js"

const router = Router()

router.post('/login', usuariosController.loginUsuario)
router.get('/profile', verifyToken, usuariosController.profileUsuario)//ruta protegida

//rutas para admin
router.get('/usuarios', verifyToken, verifyAdmin, usuariosController.getUsuarios )
router.get('/usuario/:id_usuario',verifyToken, verifyAdmin, usuariosController.getUsuarioById)
router.post('/registrarusuario', verifyToken, verifyAdmin, verifyCoordinador, usuariosController.createUsuario)
router.put('/actualizarusuario/:id_usuario', verifyToken, verifyAdmin, verifyCoordinador, usuariosController.updateUsuario)

export default router