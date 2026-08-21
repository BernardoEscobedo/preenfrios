<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./recepciones.css.
//
// RECEPCIONES: muestra lo que el preenfrío ESPERA recibir (vista
// vw_recepciones_esperadas) cruzado con lo ya recibido, y permite
// registrar la recepción real (que ocupa la cámara vía trigger de BD).
//
// Regla de negocio de cámara:
//   - El modal SUGIERE por defecto la cámara de preenfrío de la producción.
//   - Si esa está llena / en mantenimiento, el usuario puede cambiarla
//     (típicamente a una de conserva). id_camara NULL = va directo (CEDA).
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { recepcionesService } from "../../services/recepciones.service.js";
import { camarasService } from "../../services/camaras.service.js";
import "./recepciones.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

const canCreate = computed(() => puedeCrear("recepciones"));
const canEdit = computed(() => puedeEditar("recepciones"));
const canDelete = computed(() => puedeEliminar("recepciones"));

// Estados de producción (reutilizados en la vista de esperadas)
const ESTADOS = {
    0: "Cancelada",
    1: "Planeada",
    2: "En recepción",
    3: "Recibida"
};
const estadoLabel = (e) => ESTADOS[Number(e)] || "—";

// ---------- Estado ----------
const esperadas = ref([]);
const camaras = ref([]);
const cargando = ref(false);
const errorMsg = ref("");

// ---------- Filtros ----------
const busqueda = ref("");
const filtroSemana = ref("");
const filtroEstado = ref("todos"); // todos | 1 | 2 | 3
const soloPendientes = ref(false);
const soloPreenfria = ref(false);

// ---------- Modal recepción ----------
const modalAbierto = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const filaActual = ref(null); // la línea de producción esperada

const form = reactive({
    id_camara: "",
    fecha_recepcion: "",
    hora_recepcion: "",
    cajas_recibidas: 0,
    tarimas_recibidas: 0,
    temperatura: null,
    observaciones: ""
});

const formValido = computed(
    () =>
        form.fecha_recepcion !== "" &&
        form.hora_recepcion !== "" &&
        (Number(form.cajas_recibidas) > 0 || Number(form.tarimas_recibidas) > 0)
);

// ---------- Cargar datos ----------
const cargarDatos = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        const [esp, cams] = await Promise.all([
            recepcionesService.getEsperadas(),
            camarasService.getCamaras()
        ]);
        esperadas.value = esp;
        camaras.value = cams;
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar las recepciones esperadas.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarDatos);

// ---------- Filtro combinado ----------
const esperadasFiltradas = computed(() => {
    let lista = esperadas.value;

    if (filtroEstado.value !== "todos") {
        lista = lista.filter(
            (e) => Number(e.estado) === Number(filtroEstado.value)
        );
    }
    if (filtroSemana.value) {
        lista = lista.filter(
            (e) => Number(e.semana) === Number(filtroSemana.value)
        );
    }
    if (soloPendientes.value) {
        lista = lista.filter((e) => Number(e.cajas_pendientes) > 0);
    }
    if (soloPreenfria.value) {
        lista = lista.filter((e) => e.se_preenfria === true);
    }

    const q = busqueda.value.trim().toLowerCase();
    if (q) {
        lista = lista.filter((e) => {
            return (
                (e.nombre_finca || "").toLowerCase().includes(q) ||
                (e.codigo_finca || "").toLowerCase().includes(q) ||
                (e.nombre_productor || "").toLowerCase().includes(q) ||
                (e.codigo_sku || "").toLowerCase().includes(q) ||
                (e.cliente || "").toLowerCase().includes(q) ||
                (e.cedis || "").toLowerCase().includes(q) ||
                (e.region || "").toLowerCase().includes(q) ||
                (e.nombre_camara || "").toLowerCase().includes(q)
            );
        });
    }

    return lista;
});

// Totales para el pie
const totCajasEsp = computed(() =>
    esperadasFiltradas.value.reduce((s, e) => s + (Number(e.cajas_esperadas) || 0), 0)
);
const totCajasRec = computed(() =>
    esperadasFiltradas.value.reduce((s, e) => s + (Number(e.cajas_recibidas) || 0), 0)
);
const totCajasPend = computed(() =>
    esperadasFiltradas.value.reduce((s, e) => s + (Number(e.cajas_pendientes) || 0), 0)
);

const limpiarFiltros = () => {
    busqueda.value = "";
    filtroSemana.value = "";
    filtroEstado.value = "todos";
    soloPendientes.value = false;
    soloPreenfria.value = false;
};

// % recibido de una línea
const pctRecibido = (e) => {
    const esp = Number(e.cajas_esperadas) || 0;
    const rec = Number(e.cajas_recibidas) || 0;
    if (esp <= 0) return 0;
    return Math.min(100, Math.round((rec / esp) * 100));
};
const nivelClase = (pct) => {
    if (pct >= 100) return "nivel-full";
    if (pct > 0) return "nivel-parcial";
    return "nivel-cero";
};

// ---------- Abrir modal de recepción ----------
const abrirRecepcion = (fila) => {
    filaActual.value = fila;
    errorForm.value = "";
    const hoy = new Date();
    Object.assign(form, {
        // Sugerimos la cámara de preenfrío de la producción (puede ser null)
        id_camara: fila.id_camara ?? "",
        fecha_recepcion: hoy.toISOString().substring(0, 10),
        hora_recepcion: hoy.toTimeString().substring(0, 5),
        // Prellenamos con lo pendiente para agilizar la captura
        cajas_recibidas: Number(fila.cajas_pendientes) || 0,
        tarimas_recibidas: Number(fila.tarimas_pendientes) || 0,
        temperatura: null,
        observaciones: ""
    });
    modalAbierto.value = true;
};

const cerrarModal = () => {
    modalAbierto.value = false;
};

const guardar = async () => {
    errorForm.value = "";
    if (!formValido.value) {
        errorForm.value =
            "Fecha, hora y al menos cajas o tarimas recibidas son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = {
            id_produccion: filaActual.value.id_produccion,
            // id_camara vacío => null (va directo / CEDA)
            id_camara: form.id_camara === "" ? null : Number(form.id_camara),
            fecha_recepcion: form.fecha_recepcion,
            hora_recepcion: form.hora_recepcion,
            cajas_recibidas: Number(form.cajas_recibidas) || 0,
            tarimas_recibidas: Number(form.tarimas_recibidas) || 0,
            temperatura:
                form.temperatura === "" || form.temperatura === null
                    ? null
                    : Number(form.temperatura),
            observaciones: form.observaciones?.trim() || null,
            estado: 1
        };
        await recepcionesService.crearRecepcion(payload);
        cerrarModal();
        await cargarDatos();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo registrar la recepción.";
    } finally {
        guardando.value = false;
    }
};
</script>

<template>
    <section class="rec-view">
        <!-- Encabezado -->
        <div class="rec-header">
            <div>
                <h2>📥 Recepciones</h2>
                <p class="rec-subtitle">
                    Lo que el preenfrío espera recibir vs. lo recibido. Al
                    registrar una recepción se ocupa la cámara automáticamente.
                </p>
            </div>
        </div>

        <!-- Filtros -->
        <div class="rec-filtros">
            <input
                v-model="busqueda"
                type="text"
                class="rec-buscar"
                placeholder="🔍 Buscar por finca, productor, SKU, cliente, cámara…"
            />
            <input
                v-model="filtroSemana"
                type="number"
                min="1"
                max="53"
                placeholder="Semana"
                class="rec-select"
            />
            <select v-model="filtroEstado" class="rec-select">
                <option value="todos">Todos los estados</option>
                <option value="1">Planeada</option>
                <option value="2">En recepción</option>
                <option value="3">Recibida</option>
            </select>
            <label class="rec-check">
                <input type="checkbox" v-model="soloPendientes" />
                Solo pendientes
            </label>
            <label class="rec-check">
                <input type="checkbox" v-model="soloPreenfria" />
                Solo preenfrío
            </label>
            <button class="rec-btn-limpiar" @click="limpiarFiltros">Limpiar</button>
        </div>

        <div class="rec-conteo-row">
            <span class="rec-conteo">
                {{ esperadasFiltradas.length }} de {{ esperadas.length }} líneas
            </span>
            <span class="rec-totales">
                Cajas — Esperadas: <b>{{ totCajasEsp }}</b>
                · Recibidas: <b>{{ totCajasRec }}</b>
                · Pendientes: <b>{{ totCajasPend }}</b>
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="rec-estado">Cargando recepciones esperadas…</div>
        <div v-else-if="errorMsg" class="rec-estado error">{{ errorMsg }}</div>
        <div v-else-if="esperadas.length === 0" class="rec-estado">
            No hay producción planeada. Carga producción para ver qué se espera recibir.
        </div>
        <div v-else-if="esperadasFiltradas.length === 0" class="rec-estado">
            No se encontraron líneas con los filtros aplicados.
        </div>

        <!-- Tabla -->
        <div v-else class="rec-tabla-wrap">
            <table class="rec-tabla">
                <thead>
                    <tr>
                        <th class="col-centro">Sem</th>
                        <th>Finca</th>
                        <th>Productor</th>
                        <th>Cliente / Cedis</th>
                        <th>SKU</th>
                        <th>Preenfrío</th>
                        <th class="col-centro">Esperado</th>
                        <th class="col-centro">Recibido</th>
                        <th class="col-centro">Pendiente</th>
                        <th class="col-avance">Avance</th>
                        <th class="col-centro">Estado</th>
                        <th v-if="canCreate" class="col-centro">Recepción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="e in esperadasFiltradas"
                        :key="e.id_produccion"
                        :class="{ 'fila-directo': !e.se_preenfria }"
                    >
                        <td class="col-centro">{{ e.semana }}</td>
                        <td>
                            <span class="cod-pill">{{ e.codigo_finca }}</span>
                            {{ e.nombre_finca }}
                        </td>
                        <td>{{ e.nombre_productor }}</td>
                        <td>
                            <b>{{ e.cliente }}</b>
                            <small>{{ e.cedis }}</small>
                        </td>
                        <td>
                            {{ e.codigo_sku }}
                            <small>{{ e.calidad_sku }}</small>
                        </td>
                        <td>
                            <span v-if="e.se_preenfria" class="pill-pre">
                                🧊 {{ e.nombre_camara }}
                            </span>
                            <span v-else class="pill-directo">Directo</span>
                        </td>
                        <td class="col-centro">
                            {{ e.cajas_esperadas }}
                            <small>{{ e.tarimas_esperadas }} tar</small>
                        </td>
                        <td class="col-centro">
                            {{ e.cajas_recibidas }}
                            <small>{{ e.tarimas_recibidas }} tar</small>
                        </td>
                        <td class="col-centro">
                            <b :class="{ 'pend-cero': Number(e.cajas_pendientes) === 0 }">
                                {{ e.cajas_pendientes }}
                            </b>
                        </td>
                        <td class="col-avance">
                            <div class="avance-bar">
                                <div
                                    class="avance-fill"
                                    :class="nivelClase(pctRecibido(e))"
                                    :style="{ width: pctRecibido(e) + '%' }"
                                ></div>
                            </div>
                            <span class="avance-pct">{{ pctRecibido(e) }}%</span>
                        </td>
                        <td class="col-centro">
                            <span class="badge-estado" :class="'est-' + Number(e.estado)">
                                {{ estadoLabel(e.estado) }}
                            </span>
                        </td>
                        <td v-if="canCreate" class="col-centro">
                            <button
                                class="btn-recep"
                                :disabled="Number(e.cajas_pendientes) === 0"
                                :title="Number(e.cajas_pendientes) === 0 ? 'Ya recibido' : 'Registrar recepción'"
                                @click="abrirRecepcion(e)"
                            >
                                📥 Recibir
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ===== MODAL RECEPCIÓN ===== -->
        <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>📥 Registrar recepción</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <!-- Resumen de la línea -->
                    <div class="rec-resumen" v-if="filaActual">
                        <div>
                            <b>{{ filaActual.codigo_finca }} · {{ filaActual.nombre_finca }}</b>
                        </div>
                        <div class="rec-resumen-sub">
                            {{ filaActual.codigo_sku }} · {{ filaActual.cliente }}
                            ({{ filaActual.cedis }})
                        </div>
                        <div class="rec-resumen-chips">
                            <span class="chip">Esperado: {{ filaActual.cajas_esperadas }} cajas</span>
                            <span class="chip chip-rec">Recibido: {{ filaActual.cajas_recibidas }}</span>
                            <span class="chip chip-pend">Pendiente: {{ filaActual.cajas_pendientes }}</span>
                        </div>
                    </div>

                    <label>
                        Cámara que recibe
                        <select v-model="form.id_camara">
                            <option value="">Directo (no ocupa cámara)</option>
                            <option
                                v-for="c in camaras"
                                :key="c.id_camara"
                                :value="c.id_camara"
                            >
                                {{ c.nombre_camara }}
                                · {{ Number(c.tipo_camara) === 1 ? "Preenfrío" : "Conservación" }}
                            </option>
                        </select>
                        <span class="rec-hint">
                            Se sugiere la cámara de preenfrío planeada. Cámbiala a
                            conserva si es necesario.
                        </span>
                    </label>

                    <div class="grid-2">
                        <label>
                            Fecha de recepción *
                            <input v-model="form.fecha_recepcion" type="date" />
                        </label>
                        <label>
                            Hora de recepción *
                            <input v-model="form.hora_recepcion" type="time" />
                        </label>
                    </div>

                    <div class="grid-2">
                        <label>
                            Cajas recibidas
                            <input v-model="form.cajas_recibidas" type="number" min="0" />
                        </label>
                        <label>
                            Tarimas recibidas
                            <input v-model="form.tarimas_recibidas" type="number" min="0" />
                        </label>
                    </div>

                    <label>
                        Temperatura (°C)
                        <input v-model="form.temperatura" type="number" step="0.1" placeholder="Opcional" />
                    </label>

                    <label>
                        Observaciones
                        <input v-model="form.observaciones" type="text" maxlength="250" />
                    </label>

                    <p v-if="errorForm" class="form-error">{{ errorForm }}</p>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
                    <button
                        class="btn-guardar"
                        :disabled="guardando || !formValido"
                        @click="guardar"
                    >
                        {{ guardando ? "Registrando…" : "Registrar recepción" }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
