<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./productores.css (mismo patrón que SkuView).
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { productoresService } from "../../services/productores.service.js";
import "./productores.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "productores"
const canCreate = computed(() => puedeCrear("productores"));
const canEdit = computed(() => puedeEditar("productores"));
const canDelete = computed(() => puedeEliminar("productores"));

// ---------- Estado ----------
const productores = ref([]);
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
    codigo_productor: "",
    nombre: "",
    activo: 1
});

const formValido = computed(
    () =>
        form.codigo_productor.trim() !== "" &&
        form.nombre.trim() !== ""
);

// ---------- Cargar productores ----------
const cargarProductores = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        productores.value = await productoresService.getProductores();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar los productores.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarProductores);

// ---------- Filtro de búsqueda ----------
const productoresFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    if (!q) return productores.value;
    return productores.value.filter((p) => {
        const estadoTxt = Number(p.activo) === 1 ? "activo" : "inactivo";
        return (
            (p.codigo_productor || "").toLowerCase().includes(q) ||
            (p.nombre || "").toLowerCase().includes(q) ||
            estadoTxt.includes(q)
        );
    });
});

// ---------- Abrir modal para CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        codigo_productor: "",
        nombre: "",
        activo: 1
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal para EDITAR ----------
const abrirEditar = (productor) => {
    modoEdicion.value = true;
    idEditando.value = productor.id_productor;
    errorForm.value = "";
    Object.assign(form, {
        codigo_productor: productor.codigo_productor ?? "",
        nombre: productor.nombre ?? "",
        activo: Number(productor.activo) === 0 ? 0 : 1
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
        errorForm.value = "El código y el nombre son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            codigo_productor: form.codigo_productor.trim(),
            nombre: form.nombre.trim(),
            activo: Number(form.activo)
        };

        if (modoEdicion.value) {
            await productoresService.actualizarProductor(
                idEditando.value,
                payload
            );
        } else {
            await productoresService.crearProductor(payload);
        }
        cerrarModal();
        await cargarProductores();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar el productor.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (productor) => {
    const ok = window.confirm(
        `¿Eliminar el productor "${productor.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await productoresService.eliminarProductor(productor.id_productor);
        await cargarProductores();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar el productor.";
    }
};
</script>

<template>
    <section class="prod-view">
        <!-- Encabezado -->
        <div class="prod-header">
            <div>
                <h2>👨‍🌾 Productores</h2>
                <p class="prod-subtitle">
                    Catálogo de productores de fruta.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="prod-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nuevo productor
            </button>
        </div>

        <!-- Barra de herramientas: buscador + conteo -->
        <div class="prod-toolbar">
            <input
                v-model="busqueda"
                type="text"
                class="prod-buscar"
                placeholder="🔍 Buscar por código, nombre, estado…"
            />
            <span class="prod-conteo">
                {{ productoresFiltrados.length }} de {{ productores.length }} productores
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="prod-estado">Cargando productores…</div>
        <div v-else-if="errorMsg" class="prod-estado error">{{ errorMsg }}</div>
        <div v-else-if="productores.length === 0" class="prod-estado">
            No hay productores registrados todavía.
        </div>
        <div v-else-if="productoresFiltrados.length === 0" class="prod-estado">
            No se encontraron productores para "{{ busqueda }}".
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="prod-grid">
            <div
                v-for="prod in productoresFiltrados"
                :key="prod.id_productor"
                class="flip-card"
            >
                <div class="flip-inner">
                    <!-- FRENTE -->
                    <div class="flip-front">
                        <div class="prod-icon">👨‍🌾</div>
                        <h3 class="prod-nombre">{{ prod.nombre }}</h3>
                        <span class="prod-codigo">{{ prod.codigo_productor }}</span>
                        <span
                            class="badge-activo"
                            :class="Number(prod.activo) === 1 ? 'activo' : 'inactivo'"
                        >
                            {{ Number(prod.activo) === 1 ? "● Activo" : "○ Inactivo" }}
                        </span>
                    </div>

                    <!-- REVERSO -->
                    <div class="flip-back">
                        <h3 class="back-nombre">{{ prod.nombre }}</h3>
                        <p class="back-hint">¿Qué deseas hacer?</p>
                        <div class="back-actions">
                            <button
                                v-if="canEdit"
                                class="btn-editar"
                                @click="abrirEditar(prod)"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                v-if="canDelete"
                                class="btn-eliminar"
                                @click="eliminar(prod)"
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
                    <h3>{{ modoEdicion ? "✏️ Editar productor" : "➕ Nuevo productor" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Código del productor *
                        <input
                            v-model="form.codigo_productor"
                            type="text"
                            maxlength="4"
                            placeholder="Ej. P01"
                        />
                    </label>

                    <label>
                        Nombre *
                        <input
                            v-model="form.nombre"
                            type="text"
                            maxlength="100"
                            placeholder="Ej. Productora Doña Nelly"
                        />
                    </label>

                    <label>
                        Estado
                        <select v-model.number="form.activo">
                            <option :value="1">Activo</option>
                            <option :value="0">Inactivo</option>
                        </select>
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
