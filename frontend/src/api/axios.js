import axios from "axios";

// Base del API. Configúrala en el .env del frontend como:
//   VITE_API_URL=http://localhost:3000/api/preenfrio
const baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:3000/api/preenfrio";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor de request: adjunta el token JWT si existe.
// Usamos sessionStorage (no localStorage) para que la sesión se borre
// automáticamente al cerrar la pestaña.
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de response: si el token expira (401), limpia sesión
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");
            // Redirección opcional al login; se maneja desde el router.
        }
        return Promise.reject(error);
    }
);

export default api;
