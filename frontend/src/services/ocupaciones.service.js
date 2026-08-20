import api from "../api/axios.js";

// Servicio de Ocupaciones: aísla las llamadas HTTP del componente.
// Endpoints según ocupaciones.route.js, montado en index.js como
// app.use("/api/preenfrio/ocupaciones", ocupacionesRouter):
//   GET    /ocupaciones/ocupaciones                    -> listar todas
//   GET    /ocupaciones/activas                         -> solo activas (estado=1)
//   GET    /ocupaciones/ocupacion/:id                   -> obtener una
//   GET    /ocupaciones/camara/:id_camara               -> por cámara
//   POST   /ocupaciones/registrarocupacion              -> crear
//   PUT    /ocupaciones/actualizarocupacion/:id         -> actualizar
//   PATCH  /ocupaciones/cerrarocupacion/:id             -> cerrar (estado=0)
//   DELETE /ocupaciones/eliminarocupacion/:id           -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getOcupaciones = async () => {
    const { data } = await api.get("/ocupaciones/ocupaciones");
    return data;
};

const getOcupacionesActivas = async () => {
    const { data } = await api.get("/ocupaciones/activas");
    return data;
};

const getOcupacionById = async (id_ocupacion) => {
    const { data } = await api.get(`/ocupaciones/ocupacion/${id_ocupacion}`);
    return data;
};

const getOcupacionesByCamara = async (id_camara) => {
    const { data } = await api.get(`/ocupaciones/camara/${id_camara}`);
    return data;
};

const crearOcupacion = async (ocupacion) => {
    const { data } = await api.post(
        "/ocupaciones/registrarocupacion",
        ocupacion
    );
    return data;
};

const actualizarOcupacion = async (id_ocupacion, ocupacion) => {
    const { data } = await api.put(
        `/ocupaciones/actualizarocupacion/${id_ocupacion}`,
        ocupacion
    );
    return data;
};

const cerrarOcupacion = async (id_ocupacion, cierre) => {
    const { data } = await api.patch(
        `/ocupaciones/cerrarocupacion/${id_ocupacion}`,
        cierre
    );
    return data;
};

const eliminarOcupacion = async (id_ocupacion) => {
    const { data } = await api.delete(
        `/ocupaciones/eliminarocupacion/${id_ocupacion}`
    );
    return data;
};

export const ocupacionesService = {
    getOcupaciones,
    getOcupacionesActivas,
    getOcupacionById,
    getOcupacionesByCamara,
    crearOcupacion,
    actualizarOcupacion,
    cerrarOcupacion,
    eliminarOcupacion
};

export default ocupacionesService;
