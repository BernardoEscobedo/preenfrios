import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";

// Estilos globales: paleta banano reutilizable en toda la app
import "./assets/styles/theme.css";

createApp(App).use(router).mount("#app");
