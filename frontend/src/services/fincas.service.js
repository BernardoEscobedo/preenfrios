import api from "../api/axios.js";

// Servicio de Fincas: aísla las llamadas HTTP del componente.
// Endpoints según fincas.route.js, montado en index.js como
// app.use("/api/preenfrio/fincas", fincasRouter):
//   GET    /fincas/fincas                   -> listar (incluye nombre_productor)
//   GET    /fincas/finca/:id                -> obtener una
//   GET    /fincas/productor/:id_productor  -> fincas de un productor
//   POST   /fincas/registrarfinca           -> crear
//   PUT    /fincas/actualizarfinca/:id      -> actualizar
//   DELETE /fincas/eliminarfinca/:id        -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getFincas = async () => {
    const { data } = await api.get("/fincas/fincas");
    return data;
};

const getFincaById = async (id) => {
    const { data } = await api.get(`/fincas/finca/${id}`);
    return data;
};

const getFincasByProductor = async (id_productor) => {
    const { data } = await api.get(`/fincas/productor/${id_productor}`);
    return data;
};

const crearFinca = async (finca) => {
    const { data } = await api.post("/fincas/registrarfinca", finca);
    return data;
};

const actualizarFinca = async (id, finca) => {
    const { data } = await api.put(`/fincas/actualizarfinca/${id}`, finca);
    return data;
};

const eliminarFinca = async (id) => {
    const { data } = await api.delete(`/fincas/eliminarfinca/${id}`);
    return data;
};

export const fincasService = {
    getFincas,
    getFincaById,
    getFincasByProductor,
    crearFinca,
    actualizarFinca,
    eliminarFinca
};

export default fincasService;
