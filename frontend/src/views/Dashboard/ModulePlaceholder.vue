<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../../composables/useAuth.js";
import { MODULES } from "../../config/permissions.js";

const route = useRoute();
const { puedeVer, puedeCrear, puedeEditar, puedeEliminar } = useAuth();

const modulo = computed(
    () => MODULES.find((m) => m.path === route.path) || { key: "", label: "Módulo", icon: "📄" }
);

const acciones = computed(() => {
    const k = modulo.value.key;
    return {
        ver: puedeVer(k),
        crear: puedeCrear(k),
        editar: puedeEditar(k),
        eliminar: puedeEliminar(k)
    };
});
</script>

<template>
    <section>
        <div class="welcome">
            <h2>{{ modulo.icon }} {{ modulo.label }}</h2>
            <p>Panel listo para construirse. Tus permisos aquí son:</p>
        </div>

        <div class="card-perms" style="margin-bottom: 1rem;">
            <span v-if="acciones.ver" class="perm-tag perm-ver">Ver</span>
            <span v-if="acciones.crear" class="perm-tag perm-crear">Crear</span>
            <span v-if="acciones.editar" class="perm-tag perm-editar">Editar</span>
            <span v-if="acciones.eliminar" class="perm-tag perm-elim">Eliminar</span>
        </div>

        <div class="rol-info">
            Los botones de <strong>Crear / Editar / Eliminar</strong> aparecerán
            según estos permisos cuando construyamos la tabla y el formulario de
            este módulo.
        </div>
    </section>
</template>
