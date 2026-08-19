import api from "../api/axios.js";

// Servicio de Cámaras: aísla las llamadas HTTP del componente.
// Los endpoints coinciden con camaras.route.js del backend:
//   GET    /camaras/camaras                     -> listar
//   GET    /camaras/camara/:id_camara           -> obtener una
//   POST   /camaras/registrarcamara             -> crear
//   PUT    /camaras/actualizarcamara/:id_camara -> actualizar
//   DELETE /camaras/eliminarcamara/:id_camara   -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getCamaras = async () => {
    const { data } = await api.get("/camaras/camaras");
    return data;
};

const getCamaraById = async (id_camara) => {
    const { data } = await api.get(`/camaras/camara/${id_camara}`);
    return data;
};

const crearCamara = async (camara) => {
    const { data } = await api.post("/camaras/registrarcamara", camara);
    return data;
};

const actualizarCamara = async (id_camara, camara) => {
    const { data } = await api.put(
        `/camaras/actualizarcamara/${id_camara}`,
        camara
    );
    return data;
};

const eliminarCamara = async (id_camara) => {
    const { data } = await api.delete(`/camaras/eliminarcamara/${id_camara}`);
    return data;
};

export const camarasService = {
    getCamaras,
    getCamaraById,
    crearCamara,
    actualizarCamara,
    eliminarCamara
};

export default camarasService;
