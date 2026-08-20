import { createRouter, createWebHistory } from "vue-router";
import { MODULES, canAccessModule } from "../config/permissions.js";
import DashboardLayout from "../layouts/DashboardLayout.vue";
import DashboardHome from "../views/Dashboard/DashboardHome.vue";
import ModulePlaceholder from "../views/Dashboard/ModulePlaceholder.vue";
import AccesoDenegado from "../views/Dashboard/AccesoDenegado.vue";

// NOTA: la vista Login es la que ya tienes en src/views/Login/LoginView.vue
// Este router asume esa ruta; ajústala si tu Login está en otra ubicación.
const LoginView = () => import("../views/Login/LoginView.vue");

// Vistas reales de módulos ya implementados.
// A medida que construyas más catálogos, agrégalos aquí y exclúyelos
// de la generación automática en MODULOS_CON_VISTA.
const CamarasView = () => import("../views/Camaras/CamarasView.vue");
const SkuView = () => import("../views/Sku/SkuView.vue");
const ProductoresView = () => import("../views/Productores/ProductoresView.vue");
const FincasView = () => import("../views/Fincas/FincasView.vue");
const CedisClienteView = () => import("../views/CedisCliente/CedisClienteView.vue");
const OcupacionesView = () => import("../views/Ocupaciones/OcupacionesView.vue");

// Módulos que YA tienen su vista real (no usan ModulePlaceholder).
const MODULOS_CON_VISTA = ["camaras", "sku", "productores", "fincas", "cedis", "ocupaciones"];

function getIdRole() {
    try {
        // Leemos de sessionStorage (no localStorage) para que la sesión
        // se borre automáticamente al cerrar la pestaña.
        const u = JSON.parse(sessionStorage.getItem("usuario") || "null");
        const r = u?.role ?? u?.id_role ?? null;
        return r !== null ? Number(r) : null;
    } catch {
        return null;
    }
}

// Rutas hijas por módulo (excepto dashboard y los que ya tienen vista real).
// Cada una lleva meta.moduleKey.
const moduleRoutes = MODULES.filter(
    (m) => m.key !== "dashboard" && !MODULOS_CON_VISTA.includes(m.key)
).map((m) => ({
    path: m.path,
    name: m.key,
    component: ModulePlaceholder, // reemplazar por la vista real de cada módulo
    meta: { requiresAuth: true, moduleKey: m.key }
}));

const routes = [
    { path: "/", redirect: "/login" },
    { path: "/login", name: "login", component: LoginView },
    {
        path: "/",
        component: DashboardLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: "dashboard",
                name: "dashboard",
                component: DashboardHome,
                meta: { requiresAuth: true, moduleKey: "dashboard" }
            },
            // Vista real de Cámaras
            {
                path: "camaras",
                name: "camaras",
                component: CamarasView,
                meta: { requiresAuth: true, moduleKey: "camaras" }
            },
            {
                path: "sku",
                name: "sku",
                component: SkuView,
                meta: { requiresAuth: true, moduleKey: "sku" }
            },
            {
                path: "productores",
                name: "productores",
                component: ProductoresView,
                meta: { requiresAuth: true, moduleKey: "productores" }
            },
            {
                path: "fincas",
                name: "fincas",
                component: FincasView,
                meta: { requiresAuth: true, moduleKey: "fincas" }
            },
            {
                path: "cedis",
                name: "cedis",
                component: CedisClienteView,
                meta: { requiresAuth: true, moduleKey: "cedis" }
            },
            {
                path: "ocupaciones",
                name: "ocupaciones",
                component: OcupacionesView,
                meta: { requiresAuth: true, moduleKey: "ocupaciones" }
            },
            ...moduleRoutes,
            {
                path: "sin-acceso",
                name: "sin-acceso",
                component: AccesoDenegado,
                meta: { requiresAuth: true }
            }
        ]
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Guard: sesión + permiso de acceso al módulo
router.beforeEach((to, from, next) => {
    // Leemos el token de sessionStorage (no localStorage) para que la sesión
    // no persista entre cierres de pestaña.
    const token = sessionStorage.getItem("token");
    if (to.name === "login") {
        return token ? next({ name: "dashboard" }) : next();
    }
    if (to.meta.requiresAuth) {
        if (!token) return next({ name: "login" });
        if (to.meta.moduleKey) {
            const idRole = getIdRole();
            if (!canAccessModule(idRole, to.meta.moduleKey)) {
                return next({ name: "sin-acceso" });
            }
        }
    }
    next();
});

export default router;
