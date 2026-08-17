<script setup>
import { computed } from "vue";
import { useAuth } from "../composables/useAuth.js";

defineProps({
    colapsado: { type: Boolean, default: false }
});

const { modulosVisibles } = useAuth();

// Agrupa los módulos visibles por su 'group'
const grupos = computed(() => {
    const map = {};
    for (const m of modulosVisibles.value) {
        if (!map[m.group]) map[m.group] = [];
        map[m.group].push(m);
    }
    return map;
});
</script>

<template>
    <aside class="sidebar" :class="{ colapsado }">
        <div class="sidebar-header">
            <div class="logo-mini">🍌</div>
            <div v-if="!colapsado" class="marca">
                Chanitos
                <small>Preenfrío</small>
            </div>
        </div>

        <nav class="sidebar-nav">
            <template v-for="(items, grupo) in grupos" :key="grupo">
                <div class="nav-group-title">{{ colapsado ? "•" : grupo }}</div>
                <router-link
                    v-for="mod in items"
                    :key="mod.key"
                    :to="mod.path"
                    class="nav-item"
                    active-class="activo"
                >
                    <span class="ico">{{ mod.icon }}</span>
                    <span v-if="!colapsado" class="txt">{{ mod.label }}</span>
                </router-link>
            </template>
        </nav>
    </aside>
</template>
