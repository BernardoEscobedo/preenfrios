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

const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
};

const getToken = () => localStorage.getItem("token");

const isAuthenticated = () => !!localStorage.getItem("token");

export const authService = {
    login,
    logout,
    getToken,
    isAuthenticated
};

export default authService;
