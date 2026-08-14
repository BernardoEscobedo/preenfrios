import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/Login/LoginView.vue";

// Guard simple basado en el token en localStorage
const requireAuth = (to, from, next) => {
    const token = localStorage.getItem("token");
    if (token) {
        next();
    } else {
        next({ name: "login" });
    }
};

const routes = [
    {
        path: "/",
        redirect: "/login"
    },
    {
        path: "/login",
        name: "login",
        component: LoginView
    },
    {
        path: "/dashboard",
        name: "dashboard",
        // Placeholder: reemplaza por tu vista real de dashboard cuando la tengas
        component: () => import("../views/Login/LoginView.vue"),
        beforeEnter: requireAuth
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
