<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./cedisCliente.css (mismo patrón que CamarasView).
// Vista en TARJETAS flip con buscador y modal para crear/editar.
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { cedisClienteService } from "../../services/cedisCliente.service.js";
import "./cedisCliente.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "cedis"
const canCreate = computed(() => puedeCrear("cedis"));
const canEdit = computed(() => puedeEditar("cedis"));
const canDelete = computed(() => puedeEliminar("cedis"));

// ---------- Estado ----------
const registros = ref([]);
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
    cliente: "",
    cedis: "",
    acronimo: ""
});

const formValido = computed(
    () => form.cliente.trim() !== "" && form.cedis.trim() !== ""
);

// ---------- Cargar registros ----------
const cargarRegistros = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        registros.value = await cedisClienteService.getCedisClientes();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar los cedis/clientes.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarRegistros);

// ---------- Filtro de búsqueda ----------
const registrosFiltrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    if (!q) return registros.value;
    return registros.value.filter((r) => {
        return (
            (r.cliente || "").toLowerCase().includes(q) ||
            (r.cedis || "").toLowerCase().includes(q) ||
            (r.acronimo || "").toLowerCase().includes(q)
        );
    });
});

// ---------- Abrir modal para CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        cliente: "",
        cedis: "",
        acronimo: ""
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal para EDITAR ----------
const abrirEditar = (registro) => {
    modoEdicion.value = true;
    idEditando.value = registro.id_cc;
    errorForm.value = "";
    Object.assign(form, {
        cliente: registro.cliente ?? "",
        cedis: registro.cedis ?? "",
        acronimo: registro.acronimo ?? ""
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
        errorForm.value = "El cliente y el cedis son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            cliente: form.cliente.trim(),
            cedis: form.cedis.trim(),
            acronimo: form.acronimo?.trim() || null
        };

        if (modoEdicion.value) {
            await cedisClienteService.actualizarCedisCliente(
                idEditando.value,
                payload
            );
        } else {
            await cedisClienteService.crearCedisCliente(payload);
        }
        cerrarModal();
        await cargarRegistros();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar el cedis/cliente.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (registro) => {
    const ok = window.confirm(
        `¿Eliminar el cedis/cliente "${registro.cliente} - ${registro.cedis}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await cedisClienteService.eliminarCedisCliente(registro.id_cc);
        await cargarRegistros();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar el cedis/cliente.";
    }
};
</script>

<template>
    <section class="cc-view">
        <!-- Encabezado -->
        <div class="cc-header">
            <div>
                <h2>🏬 Cedis / Clientes</h2>
                <p class="cc-subtitle">
                    Catálogo de centros de distribución y clientes.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="cc-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nuevo cedis/cliente
            </button>
        </div>

        <!-- Barra de herramientas: buscador + conteo -->
        <div class="cc-toolbar">
            <input
                v-model="busqueda"
                type="text"
                class="cc-buscar"
                placeholder="🔍 Buscar por cliente, cedis, acrónimo…"
            />
            <span class="cc-conteo">
                {{ registrosFiltrados.length }} de {{ registros.length }} registros
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="cc-estado">Cargando cedis/clientes…</div>
        <div v-else-if="errorMsg" class="cc-estado error">{{ errorMsg }}</div>
        <div v-else-if="registros.length === 0" class="cc-estado">
            No hay cedis/clientes registrados todavía.
        </div>
        <div v-else-if="registrosFiltrados.length === 0" class="cc-estado">
            No se encontraron registros para "{{ busqueda }}".
        </div>

        <!-- Grid de tarjetas -->
        <div v-else class="cc-grid">
            <div
                v-for="reg in registrosFiltrados"
                :key="reg.id_cc"
                class="flip-card"
            >
                <div class="flip-inner">
                    <!-- FRENTE -->
                    <div class="flip-front">
                        <div class="cc-icon">🏬</div>
                        <span class="cc-acronimo" v-if="reg.acronimo">
                            {{ reg.acronimo }}
                        </span>
                        <h3 class="cc-cliente">{{ reg.cliente }}</h3>
                        <div class="cc-cedis">📦 {{ reg.cedis }}</div>
                    </div>

                    <!-- REVERSO -->
                    <div class="flip-back">
                        <h3 class="back-cliente">{{ reg.cliente }}</h3>
                        <p class="back-hint">¿Qué deseas hacer?</p>
                        <div class="back-actions">
                            <button
                                v-if="canEdit"
                                class="btn-editar"
                                @click="abrirEditar(reg)"
                            >
                                ✏️ Editar
                            </button>
                            <button
                                v-if="canDelete"
                                class="btn-eliminar"
                                @click="eliminar(reg)"
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
                    <h3>{{ modoEdicion ? "✏️ Editar cedis/cliente" : "➕ Nuevo cedis/cliente" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Cliente *
                        <input
                            v-model="form.cliente"
                            type="text"
                            maxlength="80"
                            placeholder="Ej. Walmart"
                        />
                    </label>

                    <label>
                        Cedis *
                        <input
                            v-model="form.cedis"
                            type="text"
                            maxlength="80"
                            placeholder="Ej. CEDA Iztapalapa"
                        />
                    </label>

                    <label>
                        Acrónimo
                        <input
                            v-model="form.acronimo"
                            type="text"
                            maxlength="50"
                            placeholder="Ej. WMT-CEDA"
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
