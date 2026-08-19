import api from "../api/axios.js";

// Servicio de autenticación: aísla las llamadas HTTP del componente.
// El backend espera { usuario, password_hash } y devuelve { ok, token, usuario }.
// (Ver usuarios.controller.js -> loginUsuario)
const login = async (usuario, password) => {
    const { data } = await api.post("/usuarios/login", {
        usuario,
        password_hash: password
    });
    return data;
};

// Usamos sessionStorage (no localStorage) para que la sesión se borre
// automáticamente al cerrar la pestaña.
const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
};

const getToken = () => sessionStorage.getItem("token");

const isAuthenticated = () => !!sessionStorage.getItem("token");

export const authService = {
    login,
    logout,
    getToken,
    isAuthenticated
};

export default authService;
