<script setup>
import { computed } from "vue";
import { useAuth } from "../../composables/useAuth.js";

// Ya NO necesitamos "can" aquí porque quitamos los badges de permisos
// y las tarjetas KPI. Solo mostramos el nombre y los módulos.
const { nombreEmpleado, roleLabel, idRole, modulosVisibles } = useAuth();

// Descripción de lo que puede hacer el rol
const descripcionRol = computed(() => {
    switch (idRole.value) {
        case 1:
            return "Acceso total: puedes ver, crear, modificar y eliminar en todos los paneles.";
        case 2:
            return "Acceso a todos los paneles. Puedes ver, crear y modificar, pero no eliminar.";
        case 3:
            return "Puedes ver y crear en operación y catálogos. No accedes a Usuarios ni Empleados, ni puedes modificar o eliminar.";
        case 4:
            return "Captura de operación: registra Lotes, Bloques, Pulpeos, Inventarios, Mantenimientos, Transportes y Despachos.";
        default:
            return "";
    }
});

// Tarjetas: módulos visibles distintos de 'dashboard', agrupados.
// Ya NO calculamos permisos por tarjeta (se quitaron los badges Ver/Crear).
const tarjetasPorGrupo = computed(() => {
    const map = {};
    for (const m of modulosVisibles.value) {
        if (m.key === "dashboard") continue;
        if (!map[m.group]) map[m.group] = [];
        map[m.group].push({ ...m });
    }
    return map;
});
</script>

<template>
    <section>
        <div class="welcome">
            <h2>Hola, {{ nombreEmpleado }} 👋</h2>
            <p>Bienvenido al Sistema de Control de Preenfrío · Frutas Chanitos</p>
        </div>

        <div class="rol-info">
            <strong>Rol: {{ roleLabel }}.</strong> {{ descripcionRol }}
        </div>

        <!-- Tarjetas de módulos agrupadas -->
        <template v-for="(items, grupo) in tarjetasPorGrupo" :key="grupo">
            <div class="seccion-titulo">{{ grupo }}</div>
            <div class="cards-grid">
                <router-link
                    v-for="mod in items"
                    :key="mod.key"
                    :to="mod.path"
                    class="card-mod"
                >
                    <div class="card-ico">{{ mod.icon }}</div>
                    <div class="card-title">{{ mod.label }}</div>
                </router-link>
            </div>
        </template>
    </section>
</template>
