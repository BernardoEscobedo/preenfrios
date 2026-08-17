import { ref, computed } from "vue";
import {
    can,
    canAccessModule,
    visibleModules,
    ROLE_LABEL
} from "../config/permissions.js";

// Estado del usuario (leído de localStorage al iniciar la app)
const usuario = ref(cargarUsuario());

function cargarUsuario() {
    try {
        const raw = localStorage.getItem("usuario");
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

    const nombreUsuario = computed(
        () => usuario.value?.usuario || usuario.value?.correo || "Usuario"
    );

    const estaAutenticado = computed(() => !!localStorage.getItem("token"));

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
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        usuario.value = null;
    };

    return {
        usuario,
        idRole,
        roleLabel,
        nombreUsuario,
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
