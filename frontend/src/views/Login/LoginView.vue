<script setup>
// El componente SOLO orquesta: importa la lógica (composable) y los estilos.
// Nada de reglas de negocio ni llamadas HTTP aquí (van en useLogin/auth.service).
import { useRouter } from "vue-router";
import { useLogin } from "../../composables/useLogin.js";
import "./login.css";

// Assets desde src/assets/imagenes
import logo from "../../assets/imagenes/LOGO_CHANITOS.png";

const router = useRouter();

const {
    form,
    cargando,
    errorMsg,
    mostrarPassword,
    formValido,
    togglePassword,
    limpiarError,
    iniciarSesion
} = useLogin();

const onSubmit = () => {
    iniciarSesion(() => {
        // Redirige al dashboard tras un login exitoso.
        router.push("/dashboard");
    });
};
</script>

<template>
    <div class="login-page">
        <!-- Mitad izquierda: foto de fondo -->
        <div class="login-foto">
            <div class="login-foto-overlay">
                <img :src="logo" alt="Frutas Chanitos" class="login-foto-logo" />
                <h2 class="login-foto-titulo">Sistema de Control de Preenfrío</h2>
                <p class="login-foto-texto">
                    Trazabilidad, recepción y ocupación de cámaras en un solo lugar.
                </p>
            </div>
        </div>

        <!-- Mitad derecha: tarjeta de login -->
        <div class="login-panel">
            <div class="login-card">
                

                <h1 class="login-title">Sistema de Preenfrío</h1>
                <p class="login-subtitle">Frutas Chanitos · Acceso al panel</p>

                <form class="login-form" @submit.prevent="onSubmit">
                    <div class="field">
                        <label for="usuario">Usuario</label>
                        <div class="input-wrap">
                            <input
                                id="usuario"
                                v-model="form.usuario"
                                type="text"
                                placeholder="Tu usuario"
                                autocomplete="username"
                                @input="limpiarError"
                            />
                        </div>
                    </div>

                    <div class="field">
                        <label for="password">Contraseña</label>
                        <div class="input-wrap">
                            <input
                                id="password"
                                v-model="form.password"
                                :type="mostrarPassword ? 'text' : 'password'"
                                placeholder="Tu contraseña"
                                autocomplete="current-password"
                                @input="limpiarError"
                            />
                            <button
                                type="button"
                                class="toggle-pass"
                                @click="togglePassword"
                            >
                                {{ mostrarPassword ? "Ocultar" : "Mostrar" }}
                            </button>
                        </div>
                    </div>

                    <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>

                    <button
                        type="submit"
                        class="login-btn"
                        :disabled="cargando || !formValido"
                    >
                        <span v-if="cargando" class="spinner"></span>
                        {{ cargando ? "Ingresando..." : "Iniciar sesión" }}
                    </button>
                </form>

                <p class="login-foot">
                    © {{ new Date().getFullYear() }} Frutas Chanitos · Dirección de Logística
                </p>
            </div>
        </div>
    </div>
</template>
