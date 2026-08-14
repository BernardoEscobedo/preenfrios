<script setup>
// Raíz de la app: solo renderiza la vista activa según el router.
</script>

<template>
    <router-view />
</template>

<style>
/* Reset mínimo global */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body,
#app {
    height: 100%;
}
</style>