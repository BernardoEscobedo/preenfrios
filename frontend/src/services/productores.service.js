import api from "../api/axios.js";

// Servicio de Productores: aísla las llamadas HTTP del componente.
// Endpoints según productores.route.js, montado en index.js como
// app.use("/api/preenfrio/productores", productoresRouter):
//   GET    /productores/productores            -> listar
//   GET    /productores/productor/:id          -> obtener uno
//   POST   /productores/registrarproductor     -> crear
//   PUT    /productores/actualizarproductor/:id -> actualizar
//   DELETE /productores/eliminarproductor/:id  -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getProductores = async () => {
    const { data } = await api.get("/productores/productores");
    return data;
};

const getProductorById = async (id) => {
    const { data } = await api.get(`/productores/productor/${id}`);
    return data;
};

const crearProductor = async (productor) => {
    const { data } = await api.post(
        "/productores/registrarproductor",
        productor
    );
    return data;
};

const actualizarProductor = async (id, productor) => {
    const { data } = await api.put(
        `/productores/actualizarproductor/${id}`,
        productor
    );
    return data;
};

const eliminarProductor = async (id) => {
    const { data } = await api.delete(`/productores/eliminarproductor/${id}`);
    return data;
};

export const productoresService = {
    getProductores,
    getProductorById,
    crearProductor,
    actualizarProductor,
    eliminarProductor
};

export default productoresService;
