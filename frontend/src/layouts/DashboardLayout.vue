<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "../components/Sidebar.vue";
import Topbar from "../components/Topbar.vue";
import { MODULES } from "../config/permissions.js";
import "../assets/styles/dashboard.css";

const colapsado = ref(false);
const route = useRoute();

const tituloActual = computed(() => {
    const mod = MODULES.find((m) => m.path === route.path);
    return mod ? mod.label : "Panel";
});

const toggleSidebar = () => {
    colapsado.value = !colapsado.value;
};
</script>

<template>
    <div class="layout">
        <Sidebar :colapsado="colapsado" />
        <div class="main">
            <Topbar :titulo="tituloActual" @toggle-sidebar="toggleSidebar" />
            <main class="contenido">
                <router-view />
            </main>
        </div>
    </div>
</template>
