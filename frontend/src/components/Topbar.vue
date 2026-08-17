<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";

defineProps({
    titulo: { type: String, default: "Panel" }
});

const emit = defineEmits(["toggle-sidebar"]);

const router = useRouter();
const { nombreUsuario, roleLabel, cerrarSesion } = useAuth();

const iniciales = computed(() =>
    (nombreUsuario.value || "U").substring(0, 2).toUpperCase()
);

const salir = () => {
    cerrarSesion();
    router.push("/login");
};
</script>

<template>
    <header class="topbar">
        <div class="topbar-left">
            <button
                class="btn-colapsar"
                title="Contraer/expandir menú"
                @click="emit('toggle-sidebar')"
            >
                ☰
            </button>
            <span class="topbar-title">{{ titulo }}</span>
        </div>

        <div class="topbar-right">
            <div class="user-chip">
                <div class="user-avatar">{{ iniciales }}</div>
                <div class="user-meta">
                    <div class="nombre">{{ nombreUsuario }}</div>
                    <div><span class="badge-rol">{{ roleLabel }}</span></div>
                </div>
            </div>
            <button class="btn-salir" @click="salir">Salir</button>
        </div>
    </header>
</template>
