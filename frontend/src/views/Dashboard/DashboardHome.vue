<script setup>
import { computed } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { can } from "../../config/permissions.js";

const { nombreUsuario, roleLabel, idRole, modulosVisibles } = useAuth();

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

// Tarjetas: módulos visibles distintos de 'dashboard', con sus permisos, agrupados
const tarjetasPorGrupo = computed(() => {
    const map = {};
    for (const m of modulosVisibles.value) {
        if (m.key === "dashboard") continue;
        if (!map[m.group]) map[m.group] = [];
        map[m.group].push({
            ...m,
            perms: {
                view: can(idRole.value, m.key, "view"),
                create: can(idRole.value, m.key, "create"),
                edit: can(idRole.value, m.key, "edit"),
                delete: can(idRole.value, m.key, "delete")
            }
        });
    }
    return map;
});

// KPIs simples basados en accesos del rol
const kpis = computed(() => {
    const mods = modulosVisibles.value.filter((m) => m.key !== "dashboard");
    const puedeCrear = mods.filter((m) => can(idRole.value, m.key, "create")).length;
    const puedeEditar = mods.filter((m) => can(idRole.value, m.key, "edit")).length;
    const puedeEliminar = mods.filter((m) => can(idRole.value, m.key, "delete")).length;
    return [
        { ico: "📂", num: mods.length, lbl: "Paneles disponibles" },
        { ico: "➕", num: puedeCrear, lbl: "Puedes crear" },
        { ico: "✏️", num: puedeEditar, lbl: "Puedes editar" },
        { ico: "🗑️", num: puedeEliminar, lbl: "Puedes eliminar" }
    ];
});
</script>

<template>
    <section>
        <div class="welcome">
            <h2>Hola, {{ nombreUsuario }} 👋</h2>
            <p>Bienvenido al Sistema de Control de Preenfrío · Frutas Chanitos</p>
        </div>

        <div class="rol-info">
            <strong>Rol: {{ roleLabel }}.</strong> {{ descripcionRol }}
        </div>

        <!-- KPIs de acceso -->
        <div class="kpi-row">
            <div v-for="(k, i) in kpis" :key="i" class="kpi">
                <div class="kpi-ico">{{ k.ico }}</div>
                <div>
                    <div class="kpi-num">{{ k.num }}</div>
                    <div class="kpi-lbl">{{ k.lbl }}</div>
                </div>
            </div>
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
                    <div class="card-perms">
                        <span v-if="mod.perms.view" class="perm-tag perm-ver">Ver</span>
                        <span v-if="mod.perms.create" class="perm-tag perm-crear">Crear</span>
                        <span v-if="mod.perms.edit" class="perm-tag perm-editar">Editar</span>
                        <span v-if="mod.perms.delete" class="perm-tag perm-elim">Eliminar</span>
                    </div>
                </router-link>
            </div>
        </template>
    </section>
</template>
