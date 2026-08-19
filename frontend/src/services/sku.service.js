import api from "../api/axios.js";

// Servicio de SKU: aísla las llamadas HTTP del componente.
// Los endpoints coinciden con skuPt.route.js del backend, montado en
// index.js como app.use("/api/preenfrio/skupt", skuPtRouter):
//   GET    /skupt/skupt              -> listar
//   GET    /skupt/sku/:id            -> obtener uno
//   POST   /skupt/registrarsku       -> crear
//   PUT    /skupt/actualizarsku/:id  -> actualizar
//   DELETE /skupt/eliminarsku/:id    -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getSkus = async () => {
    const { data } = await api.get("/skupt/skupt");
    return data;
};

const getSkuById = async (id) => {
    const { data } = await api.get(`/skupt/sku/${id}`);
    return data;
};

const crearSku = async (sku) => {
    const { data } = await api.post("/skupt/registrarsku", sku);
    return data;
};

const actualizarSku = async (id, sku) => {
    const { data } = await api.put(`/skupt/actualizarsku/${id}`, sku);
    return data;
};

const eliminarSku = async (id) => {
    const { data } = await api.delete(`/skupt/eliminarsku/${id}`);
    return data;
};

export const skuService = {
    getSkus,
    getSkuById,
    crearSku,
    actualizarSku,
    eliminarSku
};

export default skuService;
