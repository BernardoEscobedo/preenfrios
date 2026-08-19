import { ref, computed } from "vue";
import {
    can,
    canAccessModule,
    visibleModules,
    ROLE_LABEL
} from "../config/permissions.js";

// Estado del usuario (leído de sessionStorage al iniciar la app)
// sessionStorage se borra automáticamente al cerrar la pestaña,
// por lo que la sesión NO persiste entre cierres del navegador.
const usuario = ref(cargarUsuario());

function cargarUsuario() {
    try {
        const raw = sessionStorage.getItem("usuario");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function useAuth() {
    // El backend devuelve usuario.role (loginUsuario); aceptamos también id_role
    const idRole = computed(() => {
        const r = usuario.value?.role ?? usuario.value?.id_role ?? null;
        return r !== null ? Number(r) : null;
    });

    const roleLabel = computed(() =>
        idRole.value ? ROLE_LABEL[idRole.value] || "Desconocido" : ""
    );

    // Nombre de la cuenta (login) — se mantiene por compatibilidad
    const nombreUsuario = computed(
        () => usuario.value?.usuario || usuario.value?.correo || "Usuario"
    );

    // Nombre del EMPLEADO para mostrar en el saludo del dashboard.
    // Intenta varios nombres de campo comunes que el backend podría enviar.
    // Si ninguno existe, cae de respaldo al nombre de usuario.
    // ► Asegúrate de que tu backend (loginUsuario) devuelva el nombre del
    //   empleado en alguno de estos campos: nombre_empleado, nombreEmpleado,
    //   nombre_completo, empleado o nombre.
    const nombreEmpleado = computed(() => {
        const u = usuario.value;
        return (
            u?.nombre_empleado ||
            u?.nombreEmpleado ||
            u?.nombre_completo ||
            u?.nombreCompleto ||
            u?.empleado ||
            u?.nombre ||
            u?.usuario ||
            u?.correo ||
            "Usuario"
        );
    });

    const estaAutenticado = computed(() => !!sessionStorage.getItem("token"));

    // Helpers por acción
    const puedeVer = (mod) => can(idRole.value, mod, "view");
    const puedeCrear = (mod) => can(idRole.value, mod, "create");
    const puedeEditar = (mod) => can(idRole.value, mod, "edit");
    const puedeEliminar = (mod) => can(idRole.value, mod, "delete");
    const puedeAccederModulo = (mod) => canAccessModule(idRole.value, mod);
    const modulosVisibles = computed(() => visibleModules(idRole.value));

    const refrescarUsuario = () => {
        usuario.value = cargarUsuario();
    };

    const cerrarSesion = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");
        usuario.value = null;
    };

    return {
        usuario,
        idRole,
        roleLabel,
        nombreUsuario,
        nombreEmpleado,
        estaAutenticado,
        puedeVer,
        puedeCrear,
        puedeEditar,
        puedeEliminar,
        puedeAccederModulo,
        modulosVisibles,
        refrescarUsuario,
        cerrarSesion
    };
}
