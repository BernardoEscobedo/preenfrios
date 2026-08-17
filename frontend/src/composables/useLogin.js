import { ref, reactive, computed } from "vue";
import { authService } from "../services/auth.service.js";
import { useAuth } from "./useAuth.js";

// Composable que concentra TODA la lógica del login:
// estado del formulario, validación, envío y manejo de errores.
// El componente .vue solo consume esto (separación de responsabilidades).
export function useLogin() {
    const form = reactive({
        usuario: "",
        password: ""
    });

    const cargando = ref(false);
    const errorMsg = ref("");
    const mostrarPassword = ref(false);

    const { refrescarUsuario } = useAuth();

    // Validación mínima en cliente
    const formValido = computed(
        () => form.usuario.trim() !== "" && form.password.trim() !== ""
    );

    const togglePassword = () => {
        mostrarPassword.value = !mostrarPassword.value;
    };

    const limpiarError = () => {
        errorMsg.value = "";
    };

    // onSuccess: callback que ejecuta el componente (ej. redirigir con el router)
    const iniciarSesion = async (onSuccess) => {
        errorMsg.value = "";

        if (!formValido.value) {
            errorMsg.value = "Ingresa tu usuario y contraseña.";
            return;
        }

        cargando.value = true;
        try {
            const data = await authService.login(form.usuario, form.password);

            if (data && data.ok && data.token) {
                localStorage.setItem("token", data.token);
                if (data.usuario) {
                    localStorage.setItem("usuario", JSON.stringify(data.usuario));
                }

                // Actualiza el ref reactivo compartido (useAuth) con los datos
                // recién guardados. Sin esto, si el usuario cierra sesión e
                // inicia con otra cuenta SIN recargar la página, el dashboard
                // sigue mostrando el estado viejo (o vacío).
                refrescarUsuario();

                if (typeof onSuccess === "function") {
                    onSuccess(data);
                }
            } else {
                errorMsg.value =
                    (data && data.msg) || "No fue posible iniciar sesión.";
            }
        } catch (error) {
            const status = error?.response?.status;
            const backendMsg = error?.response?.data?.msg;

            if (status === 404) {
                errorMsg.value = "Usuario no encontrado.";
            } else if (status === 401) {
                errorMsg.value = "Contraseña incorrecta.";
            } else if (status === 400) {
                errorMsg.value = backendMsg || "Faltan datos por capturar.";
            } else {
                errorMsg.value =
                    backendMsg || "Error de conexión con el servidor.";
            }
        } finally {
            cargando.value = false;
        }
    };

    return {
        form,
        cargando,
        errorMsg,
        mostrarPassword,
        formValido,
        togglePassword,
        limpiarError,
        iniciarSesion
    };
}