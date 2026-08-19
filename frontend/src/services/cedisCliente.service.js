import api from "../api/axios.js";

// Servicio de Cedis/Clientes: aísla las llamadas HTTP del componente.
// Endpoints según cedisCliente.route.js, montado en index.js como
// app.use("/api/preenfrio/cedisclientes", cedisClienteRouter):
//   GET    /cedisclientes/cedisclientes              -> listar
//   GET    /cedisclientes/cediscliente/:id_cc        -> obtener uno
//   POST   /cedisclientes/registrarcediscliente      -> crear
//   PUT    /cedisclientes/actualizarcediscliente/:id_cc -> actualizar
//   DELETE /cedisclientes/eliminarcediscliente/:id_cc   -> eliminar
// La baseURL de axios ya incluye /api/preenfrio (ver api/axios.js).

const getCedisClientes = async () => {
    const { data } = await api.get("/cedisclientes/cedisclientes");
    return data;
};

const getCedisClienteById = async (id_cc) => {
    const { data } = await api.get(`/cedisclientes/cediscliente/${id_cc}`);
    return data;
};

const crearCedisCliente = async (registro) => {
    const { data } = await api.post(
        "/cedisclientes/registrarcediscliente",
        registro
    );
    return data;
};

const actualizarCedisCliente = async (id_cc, registro) => {
    const { data } = await api.put(
        `/cedisclientes/actualizarcediscliente/${id_cc}`,
        registro
    );
    return data;
};

const eliminarCedisCliente = async (id_cc) => {
    const { data } = await api.delete(
        `/cedisclientes/eliminarcediscliente/${id_cc}`
    );
    return data;
};

export const cedisClienteService = {
    getCedisClientes,
    getCedisClienteById,
    crearCedisCliente,
    actualizarCedisCliente,
    eliminarCedisCliente
};

export default cedisClienteService;
