<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./sku.css (mismo patrón que CamarasView).
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { skuService } from "../../services/sku.service.js";
import "./sku.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "sku"
const canCreate = computed(() => puedeCrear("sku"));
const canEdit = computed(() => puedeEditar("sku"));
const canDelete = computed(() => puedeEliminar("sku"));

// ---------- Estado ----------
const skus = ref([]);
const cargando = ref(false);
const errorMsg = ref("");
const busqueda = ref("");

// ---------- Modal ----------
const modalAbierto = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const idEditando = ref(null);

const form = reactive({
    codigo_sku: "",
    calidad: ""
});

const formValido = computed(() => form.codigo_sku.trim() !== "");

// ---------- Cargar SKUs ----------
const cargarSkus = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        skus.value = await skuService.getSkus();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar los SKU.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarSkus);

// ---------- Filtro de búsqueda ----------
const skusFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    if (!q) return skus.value;
    return skus.value.filter((s) => {
        return (
            (s.codigo_sku || "").toLowerCase().includes(q) ||
            (s.calidad || "").toLowerCase().includes(q)
        );
    });
});

// ---------- Abrir modal para CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        codigo_sku: "",
        calidad: ""
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal para EDITAR ----------
const abrirEditar = (sku) => {
    modoEdicion.value = true;
    idEditando.value = sku.id_sku;
    errorForm.value = "";
    Object.assign(form, {
        codigo_sku: sku.codigo_sku ?? "",
        calidad: sku.calidad ?? ""
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
        errorForm.value = "El código SKU es obligatorio.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            codigo_sku: form.codigo_sku.trim(),
            calidad: form.calidad?.trim() || null
        };

        if (modoEdicion.value) {
            await skuService.actualizarSku(idEditando.value, payload);
        } else {
            await skuService.crearSku(payload);
        }
        cerrarModal();
        await cargarSkus();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar el SKU.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (sku) => {
    const ok = window.confirm(
        `¿Eliminar el SKU "${sku.codigo_sku}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await skuService.eliminarSku(sku.id_sku);
        await cargarSkus();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar el SKU.";
    }
};
</script>

<template>
    <section class="sku-view">
        <!-- Encabezado -->
        <div class="sku-header">
            <div>
                <h2>🏷️ SKU</h2>
                <p class="sku-subtitle">
                    Catálogo de SKU de producto terminado.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="sku-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nuevo SKU
            </button>
        </div>

        <!-- Barra de herramientas: buscador + conteo -->
        <div class="sku-toolbar">
            <input
                v-model="busqueda"
                type="text"
                class="sku-buscar"
                placeholder="🔍 Buscar por código o calidad…"
            />
            <span class="sku-conteo">
                {{ skusFiltrados.length }} de {{ skus.length }} SKU
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="sku-estado">Cargando SKU…</div>
        <div v-else-if="errorMsg" class="sku-estado error">{{ errorMsg }}</div>
        <div v-else-if="skus.length === 0" class="sku-estado">
            No hay SKU registrados todavía.
        </div>
        <div v-else-if="skusFiltrados.length === 0" class="sku-estado">
            No se encontraron SKU para "{{ busqueda }}".
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="sku-grid">
            <div
                v-for="sku in skusFiltrados"
                :key="sku.id_sku"
                class="flip-card"
            >
                <div class="flip-inner">
                    <!-- FRENTE -->
                    <div class="flip-front">
                        <div class="sku-icon">🏷️</div>
                        <h3 class="sku-codigo">{{ sku.codigo_sku }}</h3>
                        <span class="badge-calidad" v-if="sku.calidad">
                            {{ sku.calidad }}
                        </span>
                        <span class="badge-calidad sin" v-else>
                            Sin calidad
                        </span>
                    </div>

                    <!-- REVERSO -->
                    <div class="flip-back">
                        <h3 class="back-codigo">{{ sku.codigo_sku }}</h3>
                        <p class="back-hint">¿Qué deseas hacer?</p>
                        <div class="back-actions">
                            <button
                                v-if="canEdit"
                                class="btn-editar"
                                @click="abrirEditar(sku)"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                v-if="canDelete"
                                class="btn-eliminar"
                                @click="eliminar(sku)"
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
                    <h3>{{ modoEdicion ? "✏️ Editar SKU" : "➕ Nuevo SKU" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Código SKU *
                        <input
                            v-model="form.codigo_sku"
                            type="text"
                            maxlength="10"
                            placeholder="Ej. PT-001"
                        />
                    </label>

                    <label>
                        Calidad
                        <input
                            v-model="form.calidad"
                            type="text"
                            maxlength="70"
                            placeholder="Ej. Primera, Exportación…"
                        />
                    </label>

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
