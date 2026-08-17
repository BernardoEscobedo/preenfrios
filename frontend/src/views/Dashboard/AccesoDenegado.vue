<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
    <div class="denegado-page">
        <div class="denegado-card">
            <div class="denegado-ico">🚫</div>
            <h1>Sin acceso</h1>
            <p>Tu rol no tiene permiso para ver este panel.</p>
            <button @click="router.push('/dashboard')">Volver al inicio</button>
        </div>
    </div>
</template>

<style scoped>
.denegado-page {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}
.denegado-card {
    background: var(--crema);
    border: 1px solid var(--borde);
    border-top: 5px solid var(--error);
    border-radius: 14px;
    box-shadow: var(--sombra);
    padding: 2.2rem;
    text-align: center;
    max-width: 360px;
    font-family: "Segoe UI", system-ui, sans-serif;
}
.denegado-ico { font-size: 3rem; margin-bottom: 0.5rem; }
.denegado-card h1 { color: var(--verde-oscuro); font-size: 1.4rem; margin-bottom: 0.4rem; }
.denegado-card p { color: var(--texto-suave); font-size: 0.9rem; margin-bottom: 1.3rem; }
.denegado-card button {
    background: var(--verde);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 0.7rem 1.2rem;
    font-weight: 700;
    cursor: pointer;
}
.denegado-card button:hover { background: var(--verde-oscuro); }
</style>
