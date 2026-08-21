import api from "../api/axios.js";

// Servicio de Recepciones: aísla las llamadas HTTP del componente.
// Endpoints según recepciones.route.js, montado en index.js como
// app.use("/api/preenfrio/recepciones", recepcionesRouter):
//   GET    /recepciones/esperadas                 -> vista esperado vs recibido
//   GET    /recepciones/esperadas/semana/:semana  -> igual, por semana
//   GET    /recepciones/pendientes                -> solo lo pendiente (y preenfría)
//   GET    /recepciones/recepciones               -> historial de recepciones
//   GET    /recepciones/recepcion/:id             -> una recepción
//   GET    /recepciones/produccion/:id_produccion -> recepciones de una producción
//   POST   /recepciones/registrarrecepcion        -> crear (ocupa cámara vía trigger)
//   PUT    /recepciones/actualizarrecepcion/:id   -> actualizar
//   PATCH  /recepciones/cancelarrecepcion/:id     -> cancelar (estado=0)
//   DELETE /recepciones/eliminarrecepcion/:id     -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getEsperadas = async () => {
    const { data } = await api.get("/recepciones/esperadas");
    return data;
};

const getEsperadasBySemana = async (semana) => {
    const { data } = await api.get(`/recepciones/esperadas/semana/${semana}`);
    return data;
};

const getPendientes = async () => {
    const { data } = await api.get("/recepciones/pendientes");
    return data;
};

const getRecepciones = async () => {
    const { data } = await api.get("/recepciones/recepciones");
    return data;
};

const getRecepcionById = async (id) => {
    const { data } = await api.get(`/recepciones/recepcion/${id}`);
    return data;
};

const getRecepcionesByProduccion = async (id_produccion) => {
    const { data } = await api.get(`/recepciones/produccion/${id_produccion}`);
    return data;
};

const crearRecepcion = async (recepcion) => {
    const { data } = await api.post(
        "/recepciones/registrarrecepcion",
        recepcion
    );
    return data;
};

const actualizarRecepcion = async (id, recepcion) => {
    const { data } = await api.put(
        `/recepciones/actualizarrecepcion/${id}`,
        recepcion
    );
    return data;
};

const cancelarRecepcion = async (id) => {
    const { data } = await api.patch(`/recepciones/cancelarrecepcion/${id}`);
    return data;
};

const eliminarRecepcion = async (id) => {
    const { data } = await api.delete(`/recepciones/eliminarrecepcion/${id}`);
    return data;
};

export const recepcionesService = {
    getEsperadas,
    getEsperadasBySemana,
    getPendientes,
    getRecepciones,
    getRecepcionById,
    getRecepcionesByProduccion,
    crearRecepcion,
    actualizarRecepcion,
    cancelarRecepcion,
    eliminarRecepcion
};

export default recepcionesService;
