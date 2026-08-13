import "dotenv/config";
import express from "express";
import cors from "cors";
import usuariosRouter from "./routes/usuarios.route.js";
import empleadosRouter from "./routes/empleados.route.js";
import camarasRouter from "./routes/camaras.route.js";
import mantenimientosRouter from "./routes/mantenimientos.route.js";
import ocupacionesRouter from "./routes/ocupaciones.route.js";
import productoresRouter from "./routes/productores.route.js";
import fincasRouter from "./routes/fincas.route.js";
import skuPtRouter from "./routes/skuPt.route.js";
import lotesRouter from "./routes/lotes.route.js";
import bloquesFrutaRouter from "./routes/bloquesFruta.route.js";
import bloquesLoteDetalleRouter from "./routes/bloquesLoteDetalle.route.js";

const app = express();

// CORS
app.use(cors({
    origin: "http://localhost:5173"
}));

// MIDDLEWARES
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.static("public"));

// RUTAS
app.use(
    "/api/preenfrio/usuarios",
    usuariosRouter
);

app.use(
    "/api/preenfrio/empleados",
    empleadosRouter
);

app.use(
    "/api/preenfrio/camaras",
    camarasRouter
);

app.use(
    "/api/preenfrio/mantenimientos",
    mantenimientosRouter
);

app.use(
    "/api/preenfrio/ocupaciones",
    ocupacionesRouter
);

app.use(
    "/api/preenfrio/productores",
    productoresRouter
);

app.use(
    "/api/preenfrio/fincas",
    fincasRouter
);

app.use(
    "/api/preenfrio/skupt",
    skuPtRouter
);

app.use(
    "/api/preenfrio/lotes",
    lotesRouter
);

app.use(
    "/api/preenfrio/bloques",
    bloquesFrutaRouter
);

app.use(
    "/api/preenfrio/bloqueslotedetalle",
    bloquesLoteDetalleRouter
);

// CONFIGURACIÓN
const PORT = process.env.PORT || 3000;


console.log("ENV:", {
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
        ? "***"
        : "Not set",
});

// SERVIDOR
app.listen(
    PORT,
    () => {
        console.log(
            `🚀 Servidor corriendo en puerto ${PORT}`
        );
    }
);