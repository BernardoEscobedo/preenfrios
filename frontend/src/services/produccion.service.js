import api from "../api/axios.js";

// Servicio de Producción: aísla las llamadas HTTP del componente.
// Endpoints según produccion.route.js, montado en index.js como
// app.use("/api/preenfrio/produccion", produccionRouter):
//   GET    /produccion/produccion               -> listar
//   GET    /produccion/produccion/:id           -> obtener una
//   GET    /produccion/semana/:semana           -> por semana
//   POST   /produccion/registrarproduccion      -> crear
//   PUT    /produccion/actualizarproduccion/:id -> actualizar
//   DELETE /produccion/eliminarproduccion/:id   -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getProducciones = async () => {
    const { data } = await api.get("/produccion/produccion");
    return data;
};

const getProduccionById = async (id) => {
    const { data } = await api.get(`/produccion/produccion/${id}`);
    return data;
};

const getProduccionesBySemana = async (semana) => {
    const { data } = await api.get(`/produccion/semana/${semana}`);
    return data;
};

const crearProduccion = async (produccion) => {
    const { data } = await api.post(
        "/produccion/registrarproduccion",
        produccion
    );
    return data;
};

const actualizarProduccion = async (id, produccion) => {
    const { data } = await api.put(
        `/produccion/actualizarproduccion/${id}`,
        produccion
    );
    return data;
};

const eliminarProduccion = async (id) => {
    const { data } = await api.delete(`/produccion/eliminarproduccion/${id}`);
    return data;
};

// Carga masiva: recibe un arreglo de producciones ya mapeadas a IDs y
// las envía una por una al backend. Devuelve un resumen {ok, errores}.
// (El backend no tiene endpoint bulk; reutilizamos el POST normal.)
const crearMasivo = async (lista, onProgress) => {
    const resultado = { ok: 0, errores: [] };
    for (let i = 0; i < lista.length; i++) {
        try {
            await crearProduccion(lista[i]);
            resultado.ok++;
        } catch (error) {
            resultado.errores.push({
                fila: i + 2, // +2: fila 1 = encabezados en el Excel
                mensaje:
                    error?.response?.data?.error ||
                    "Error al insertar la fila"
            });
        }
        if (typeof onProgress === "function") {
            onProgress(i + 1, lista.length);
        }
    }
    return resultado;
};

export const produccionService = {
    getProducciones,
    getProduccionById,
    getProduccionesBySemana,
    crearProduccion,
    actualizarProduccion,
    eliminarProduccion,
    crearMasivo
};

export default produccionService;
