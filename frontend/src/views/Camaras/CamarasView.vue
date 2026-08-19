<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./camaras.css (mismo patrón que LoginView).
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { camarasService } from "../../services/camaras.service.js";
import "./camaras.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "camaras"
const canCreate = computed(() => puedeCrear("camaras"));
const canEdit = computed(() => puedeEditar("camaras"));
const canDelete = computed(() => puedeEliminar("camaras"));

// Etiquetas para tipo_camara (1 = preenfrío, 2 = conservación)
const TIPOS = {
    1: "Preenfrío",
    2: "Conservación"
};
const tipoLabel = (t) => TIPOS[Number(t)] || "Otro";

// ---------- Estado ----------
const camaras = ref([]);
const cargando = ref(false);
const errorMsg = ref("");

// ---------- Modal ----------
const modalAbierto = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const idEditando = ref(null);

const form = reactive({
    nombre_camara: "",
    tipo_camara: 1,
    ubicacion: "",
    capacidad_max_tarimas: null,
    capacidad_max_cajas: null,
    capacidad_max_bloques: null
});

const formValido = computed(
    () =>
        form.nombre_camara.trim() !== "" &&
        form.tipo_camara !== null &&
        form.tipo_camara !== ""
);

// ---------- Cargar cámaras ----------
const cargarCamaras = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        camaras.value = await camarasService.getCamaras();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar las cámaras.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarCamaras);

// ---------- Abrir modal para CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        nombre_camara: "",
        tipo_camara: 1,
        ubicacion: "",
        capacidad_max_tarimas: null,
        capacidad_max_cajas: null,
        capacidad_max_bloques: null
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal para EDITAR ----------
const abrirEditar = (camara) => {
    modoEdicion.value = true;
    idEditando.value = camara.id_camara;
    errorForm.value = "";
    Object.assign(form, {
        nombre_camara: camara.nombre_camara ?? "",
        tipo_camara: camara.tipo_camara ?? 1,
        ubicacion: camara.ubicacion ?? "",
        capacidad_max_tarimas: camara.capacidad_max_tarimas ?? null,
        capacidad_max_cajas: camara.capacidad_max_cajas ?? null,
        capacidad_max_bloques: camara.capacidad_max_bloques ?? null
    });
    modalAbierto.value = true;
};

const cerrarModal = () => {
    modalAbierto.value = false;
};

// ---------- Guardar (crear o actualizar) ----------
const guardar = async () => {
    errorForm.value = "";
    if (!formValido.value) {
        errorForm.value = "El nombre y el tipo de cámara son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            nombre_camara: form.nombre_camara.trim(),
            tipo_camara: Number(form.tipo_camara),
            ubicacion: form.ubicacion?.trim() || null,
            capacidad_max_tarimas:
                form.capacidad_max_tarimas === "" ||
                form.capacidad_max_tarimas === null
                    ? null
                    : Number(form.capacidad_max_tarimas),
            capacidad_max_cajas:
                form.capacidad_max_cajas === "" ||
                form.capacidad_max_cajas === null
                    ? null
                    : Number(form.capacidad_max_cajas),
            capacidad_max_bloques:
                form.capacidad_max_bloques === "" ||
                form.capacidad_max_bloques === null
                    ? null
                    : Number(form.capacidad_max_bloques)
        };

        if (modoEdicion.value) {
            await camarasService.actualizarCamara(idEditando.value, payload);
        } else {
            await camarasService.crearCamara(payload);
        }
        cerrarModal();
        await cargarCamaras();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar la cámara.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (camara) => {
    const ok = window.confirm(
        `¿Eliminar la cámara "${camara.nombre_camara}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await camarasService.eliminarCamara(camara.id_camara);
        await cargarCamaras();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar la cámara.";
    }
};
</script>

<template>
    <section class="camaras-view">
        <!-- Encabezado -->
        <div class="cam-header">
            <div>
                <h2>🧊 Cámaras</h2>
                <p class="cam-subtitle">
                    Catálogo de cámaras de preenfrío y conservación.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="cam-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nueva cámara
            </button>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="cam-estado">Cargando cámaras…</div>
        <div v-else-if="errorMsg" class="cam-estado error">{{ errorMsg }}</div>
        <div v-else-if="camaras.length === 0" class="cam-estado">
            No hay cámaras registradas todavía.
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="cam-grid">
            <div
                v-for="cam in camaras"
                :key="cam.id_camara"
                class="flip-card"
            >
                <div class="flip-inner">
                    <!-- FRENTE -->
                    <div class="flip-front">
                        <div class="cam-ico">🧊</div>
                        <h3 class="cam-nombre">{{ cam.nombre_camara }}</h3>
                        <span
                            class="badge-tipo"
                            :class="Number(cam.tipo_camara) === 1 ? 'tipo-pre' : 'tipo-con'"
                        >
                            {{ tipoLabel(cam.tipo_camara) }}
                        </span>
                        <div class="cam-ubi" v-if="cam.ubicacion">
                            📍 {{ cam.ubicacion }}
                        </div>
                        <ul class="cam-caps">
                            <li>🟫 Tarimas: <b>{{ cam.capacidad_max_tarimas ?? "—" }}</b></li>
                            <li>📦 Cajas: <b>{{ cam.capacidad_max_cajas ?? "—" }}</b></li>
                            <li>🧱 Bloques: <b>{{ cam.capacidad_max_bloques ?? "—" }}</b></li>
                        </ul>
                    </div>

                    <!-- REVERSO -->
                    <div class="flip-back">
                        <h3 class="back-nombre">{{ cam.nombre_camara }}</h3>
                        <p class="back-hint">¿Qué deseas hacer?</p>
                        <div class="back-actions">
                            <button
                                v-if="canEdit"
                                class="btn-editar"
                                @click="abrirEditar(cam)"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                v-if="canDelete"
                                class="btn-eliminar"
                                @click="eliminar(cam)"
                            >
                                🗑️ Eliminar
                            </button>
                            <p
                                v-if="!canEdit && !canDelete"
                                class="sin-permiso"
                            >
                                Solo lectura
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL Crear / Editar -->
        <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modoEdicion ? "✏️ Editar cámara" : "➕ Nueva cámara" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Nombre de la cámara *
                        <input
                            v-model="form.nombre_camara"
                            type="text"
                            maxlength="60"
                            placeholder="Ej. Cámara 1"
                        />
                    </label>

                    <label>
                        Tipo de cámara *
                        <select v-model="form.tipo_camara">
                            <option :value="1">Preenfrío</option>
                            <option :value="2">Conservación</option>
                        </select>
                    </label>

                    <label>
                        Ubicación
                        <input
                            v-model="form.ubicacion"
                            type="text"
                            maxlength="60"
                            placeholder="Ej. Nave A"
                        />
                    </label>

                    <div class="grid-caps">
                        <label>
                            Cap. máx. tarimas
                            <input
                                v-model="form.capacidad_max_tarimas"
                                type="number"
                                min="0"
                            />
                        </label>
                        <label>
                            Cap. máx. cajas
                            <input
                                v-model="form.capacidad_max_cajas"
                                type="number"
                                min="0"
                            />
                        </label>
                        <label>
                            Cap. máx. bloques
                            <input
                                v-model="form.capacidad_max_bloques"
                                type="number"
                                min="0"
                            />
                        </label>
                    </div>

                    <p v-if="errorForm" class="form-error">{{ errorForm }}</p>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancelar" @click="cerrarModal">
                        Cancelar
                    </button>
                    <button
                        class="btn-guardar"
                        :disabled="guardando || !formValido"
                        @click="guardar"
                    >
                        {{ guardando ? "Guardando…" : "Guardar" }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
