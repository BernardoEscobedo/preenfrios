import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization

    if(!token || !token.startsWith('Bearer ')){
        return res.status(401).json({error: "Formato de token invalido"})
    }

    console.log({token})
    token = token.split(" ")[1]

    console.log({token})

    try {
        const {id_usuario, usuario, id_role} = jwt.verify(token, process.env.JWT_SECRET)
        console.log(usuario)
        req.id_usuario = id_usuario
        req.usuario = usuario
        req.id_role = id_role
        next()
    } catch (error) {
        console.log(error)
        return res.status(400).json({error: "Token invalido"})
    }
}

export const verifyAdmin = (req, res, next) => {
    if(req.id_role == 1){
        return next()
    }
    return res.status(403).json({error:"Autorizado solo para usuario administrador"})
}

export const verifyCoordinador = ( req, res, next ) => {
    if(req.id_role == 2 || req.id_role == 1 ){
        return next()
    }
    return res.status(403).json({error:"Autorizado solo para personal coordinador"})
}

export const verifySupervisor =( req, res, next ) => {
    if(req.id_role == 3 || req.id_role == 2 || req.id_role == 1){
        return next()
    }
    return res.status(403).json({error:"Autorizado solo personal supervisor"})
}

export const verifyOperativo =( req, res, next ) => {
    if(req.id_role == 4 || req.id_role == 3 || req.id_role == 2 || req.id_role == 1){
        return next()
    }
    return res.status(403).json({error:"Autorizado solo para personal operativo"})
}