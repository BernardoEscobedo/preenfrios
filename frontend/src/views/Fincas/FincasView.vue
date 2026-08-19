<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./fincas.css.
// Vista en formato TABLA (pensada para muchos registros) con buscador,
// acciones por fila según permisos y modal para crear/editar.
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { fincasService } from "../../services/fincas.service.js";
import { productoresService } from "../../services/productores.service.js";
import "./fincas.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "fincas"
const canCreate = computed(() => puedeCrear("fincas"));
const canEdit = computed(() => puedeEditar("fincas"));
const canDelete = computed(() => puedeEliminar("fincas"));
// ¿Mostramos la columna de acciones?
const hayAcciones = computed(() => canEdit.value || canDelete.value);

// Catálogo de zonas (zona es INT en la BD).
// 1 = Chiapas, 2 = Colima, 3 = Tabasco
const ZONAS = {
    1: "Chiapas",
    2: "Colima",
    3: "Tabasco"
};
const zonaLabel = (z) => ZONAS[Number(z)] || "—";
// Lista para el dropdown del modal
const zonasOpciones = Object.entries(ZONAS).map(([valor, etiqueta]) => ({
    valor: Number(valor),
    etiqueta
}));

// ---------- Estado ----------
const fincas = ref([]);
const productores = ref([]); // para el dropdown
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
    codigo_finca: "",
    nombre: "",
    org_inv_nombre: "",
    zona: "",
    id_productor: "",
    estado: 1
});

const formValido = computed(
    () =>
        form.codigo_finca.trim() !== "" &&
        form.id_productor !== "" &&
        form.id_productor !== null
);

// ---------- Cargar fincas ----------
const cargarFincas = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        fincas.value = await fincasService.getFincas();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar las fincas.";
    } finally {
        cargando.value = false;
    }
};

// ---------- Cargar productores (para el dropdown) ----------
const cargarProductores = async () => {
    try {
        productores.value = await productoresService.getProductores();
    } catch (error) {
        console.error("No se pudieron cargar los productores:", error);
    }
};

onMounted(async () => {
    await Promise.all([cargarFincas(), cargarProductores()]);
});

// Solo productores activos para elegir al crear/editar
const productoresActivos = computed(() =>
    productores.value.filter((p) => Number(p.activo) === 1)
);

// ---------- Filtro de búsqueda ----------
const fincasFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    if (!q) return fincas.value;
    return fincas.value.filter((f) => {
        return (
            (f.codigo_finca || "").toLowerCase().includes(q) ||
            (f.nombre || "").toLowerCase().includes(q) ||
            (f.nombre_productor || "").toLowerCase().includes(q) ||
            (f.org_inv_nombre || "").toLowerCase().includes(q) ||
            zonaLabel(f.zona).toLowerCase().includes(q)
        );
    });
});

// ---------- Abrir modal para CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        codigo_finca: "",
        nombre: "",
        org_inv_nombre: "",
        zona: "",
        id_productor: "",
        estado: 1
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal para EDITAR ----------
const abrirEditar = (finca) => {
    modoEdicion.value = true;
    idEditando.value = finca.id_finca;
    errorForm.value = "";
    Object.assign(form, {
        codigo_finca: finca.codigo_finca ?? "",
        nombre: finca.nombre ?? "",
        org_inv_nombre: finca.org_inv_nombre ?? "",
        zona: finca.zona ?? "",
        id_productor: finca.id_productor ?? "",
        estado: Number(finca.estado) === 0 ? 0 : 1
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
        errorForm.value = "El código y el productor son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            codigo_finca: form.codigo_finca.trim(),
            nombre: form.nombre?.trim() || null,
            org_inv_nombre: form.org_inv_nombre?.trim() || null,
            zona:
                form.zona === "" || form.zona === null
                    ? null
                    : Number(form.zona),
            id_productor: Number(form.id_productor),
            estado: Number(form.estado)
        };

        if (modoEdicion.value) {
            await fincasService.actualizarFinca(idEditando.value, payload);
        } else {
            await fincasService.crearFinca(payload);
        }
        cerrarModal();
        await cargarFincas();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar la finca.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (finca) => {
    const ok = window.confirm(
        `¿Eliminar la finca "${finca.nombre || finca.codigo_finca}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await fincasService.eliminarFinca(finca.id_finca);
        await cargarFincas();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar la finca.";
    }
};
</script>

<template>
    <section class="finca-view">
        <!-- Encabezado -->
        <div class="finca-header">
            <div>
                <h2>🌱 Fincas</h2>
                <p class="finca-subtitle">
                    Catálogo de fincas por productor.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="finca-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nueva finca
            </button>
        </div>

        <!-- Barra de herramientas: buscador + conteo -->
        <div class="finca-toolbar">
            <input
                v-model="busqueda"
                type="text"
                class="finca-buscar"
                placeholder="🔍 Buscar por código, nombre, productor, zona…"
            />
            <span class="finca-conteo">
                {{ fincasFiltradas.length }} de {{ fincas.length }} fincas
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="finca-estado">Cargando fincas…</div>
        <div v-else-if="errorMsg" class="finca-estado error">{{ errorMsg }}</div>
        <div v-else-if="fincas.length === 0" class="finca-estado">
            No hay fincas registradas todavía.
        </div>
        <div
            v-else-if="fincasFiltradas.length === 0"
            class="finca-estado"
        >
            No se encontraron fincas para "{{ busqueda }}".
        </div>

        <!-- Tabla -->
        <div v-else class="finca-tabla-wrap">
            <table class="finca-tabla">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Productor</th>
                        <th>Organización</th>
                        <th class="col-centro">Zona</th>
                        <th class="col-centro">Estado</th>
                        <th v-if="hayAcciones" class="col-centro">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="finca in fincasFiltradas" :key="finca.id_finca">
                        <td>
                            <span class="cod-pill">{{ finca.codigo_finca }}</span>
                        </td>
                        <td>{{ finca.nombre || "—" }}</td>
                        <td>
                            <span class="prod-cod">{{ finca.codigo_productor }}</span>
                            {{ finca.nombre_productor }}
                        </td>
                        <td>{{ finca.org_inv_nombre || "—" }}</td>
                        <td class="col-centro">{{ zonaLabel(finca.zona) }}</td>
                        <td class="col-centro">
                            <span
                                class="badge-estado"
                                :class="Number(finca.estado) === 1 ? 'activo' : 'inactivo'"
                            >
                                {{ Number(finca.estado) === 1 ? "Activa" : "Inactiva" }}
                            </span>
                        </td>
                        <td v-if="hayAcciones" class="col-centro">
                            <div class="acciones">
                                <button
                                    v-if="canEdit"
                                    class="btn-icono editar"
                                    title="Editar"
                                    @click="abrirEditar(finca)"
                                >
                                    ✏️
                                </button>
                                <button
                                    v-if="canDelete"
                                    class="btn-icono eliminar"
                                    title="Eliminar"
                                    @click="eliminar(finca)"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- MODAL Crear / Editar -->
        <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modoEdicion ? "✏️ Editar finca" : "➕ Nueva finca" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Productor *
                        <select v-model="form.id_productor">
                            <option value="" disabled>
                                Selecciona un productor…
                            </option>
                            <option
                                v-for="p in productoresActivos"
                                :key="p.id_productor"
                                :value="p.id_productor"
                            >
                                {{ p.codigo_productor }} · {{ p.nombre }}
                            </option>
                        </select>
                    </label>

                    <div class="grid-2">
                        <label>
                            Código de finca *
                            <input
                                v-model="form.codigo_finca"
                                type="text"
                                maxlength="3"
                                placeholder="Ej. F01"
                            />
                        </label>
                        <label>
                            Zona
                            <select v-model="form.zona">
                                <option value="">Sin zona</option>
                                <option
                                    v-for="z in zonasOpciones"
                                    :key="z.valor"
                                    :value="z.valor"
                                >
                                    {{ z.etiqueta }}
                                </option>
                            </select>
                        </label>
                    </div>

                    <label>
                        Nombre
                        <input
                            v-model="form.nombre"
                            type="text"
                            maxlength="70"
                            placeholder="Ej. Finca Doña Nelly"
                        />
                    </label>

                    <label>
                        Organización / Inventario
                        <input
                            v-model="form.org_inv_nombre"
                            type="text"
                            maxlength="70"
                            placeholder="Ej. Nombre de la organización"
                        />
                    </label>

                    <label>
                        Estado
                        <select v-model.number="form.estado">
                            <option :value="1">Activa</option>
                            <option :value="0">Inactiva</option>
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
