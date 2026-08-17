import { createRouter, createWebHistory } from "vue-router";
import { MODULES, canAccessModule } from "../config/permissions.js";

import DashboardLayout from "../layouts/DashboardLayout.vue";
import DashboardHome from "../views/Dashboard/DashboardHome.vue";
import ModulePlaceholder from "../views/Dashboard/ModulePlaceholder.vue";
import AccesoDenegado from "../views/Dashboard/AccesoDenegado.vue";

// NOTA: la vista Login es la que ya tienes en src/views/Login/LoginView.vue
// Este router asume esa ruta; ajústala si tu Login está en otra ubicación.
const LoginView = () => import("../views/Login/LoginView.vue");

function getIdRole() {
    try {
        const u = JSON.parse(localStorage.getItem("usuario") || "null");
        const r = u?.role ?? u?.id_role ?? null;
        return r !== null ? Number(r) : null;
    } catch {
        return null;
    }
}

// Rutas hijas por módulo (excepto dashboard). Cada una lleva meta.moduleKey.
const moduleRoutes = MODULES.filter((m) => m.key !== "dashboard").map((m) => ({
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
    const token = localStorage.getItem("token");

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