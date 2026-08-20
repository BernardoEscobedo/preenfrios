<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./ocupaciones.css.
//
// Este módulo muestra la DISPONIBILIDAD de las cámaras (preenfrío y
// conservación), cruzando la capacidad máxima de cada cámara
// (camarasService) con las ocupaciones ACTIVAS (ocupacionesService).
// Distingue si una cámara está ocupada por producto/capacidad o por
// mantenimiento.
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "../../composables/useAuth.js";
import { ocupacionesService } from "../../services/ocupaciones.service.js";
import { camarasService } from "../../services/camaras.service.js";
import "./ocupaciones.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

// Permisos para el módulo "ocupaciones"
const canCreate = computed(() => puedeCrear("ocupaciones"));
const canEdit = computed(() => puedeEditar("ocupaciones"));
const canDelete = computed(() => puedeEliminar("ocupaciones"));

// Catálogos de tipos
const TIPO_OCUPACION = {
    1: "Producto",
    2: "Mantenimiento"
};
const tipoOcupLabel = (t) => TIPO_OCUPACION[Number(t)] || "—";

// Tipo de cámara (1 = preenfrío, 2 = conservación)
const TIPO_CAMARA = {
    1: "Preenfrío",
    2: "Conservación"
};
const tipoCamaraLabel = (t) => TIPO_CAMARA[Number(t)] || "Otro";

// ---------- Estado ----------
const camaras = ref([]);
const ocupacionesActivas = ref([]);
const cargando = ref(false);
const errorMsg = ref("");
const busqueda = ref("");
// Filtro de tipo en el panel de disponibilidad: "todas" | "1" | "2"
const filtroTipo = ref("todas");

// ---------- Modal crear/editar ----------
const modalAbierto = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const idEditando = ref(null);

const form = reactive({
    id_camara: "",
    tipo_ocupacion: 1,
    fecha_inicio: "",
    hora_inicio: "",
    cantidad_tarimas: 0,
    cantidad_cajas: 0,
    cantidad_bloques: 0,
    id_mantenimiento: null,
    observaciones: ""
});

const formValido = computed(
    () =>
        form.id_camara !== "" &&
        form.id_camara !== null &&
        form.fecha_inicio !== "" &&
        form.hora_inicio !== ""
);

// ---------- Modal cerrar ocupación ----------
const modalCierre = ref(false);
const cerrando = ref(false);
const errorCierre = ref("");
const ocupacionCerrar = ref(null);
const formCierre = reactive({
    fecha_fin: "",
    hora_fin: ""
});
const cierreValido = computed(
    () => formCierre.fecha_fin !== "" && formCierre.hora_fin !== ""
);

// ---------- Cámaras filtradas por tipo (para el panel) ----------
const camarasParaPanel = computed(() => {
    if (filtroTipo.value === "todas") return camaras.value;
    return camaras.value.filter(
        (c) => Number(c.tipo_camara) === Number(filtroTipo.value)
    );
});

// ---------- Mapa de disponibilidad por cámara ----------
// Para cada cámara: suma lo ocupado (tipo producto) y detecta si hay una
// ocupación de mantenimiento activa.
const disponibilidad = computed(() => {
    return camarasParaPanel.value.map((cam) => {
        const ocupsDeCamara = ocupacionesActivas.value.filter(
            (o) => Number(o.id_camara) === Number(cam.id_camara)
        );

        const enMantenimiento = ocupsDeCamara.some(
            (o) => Number(o.tipo_ocupacion) === 2
        );

        // Suma de ocupación por producto (tipo 1)
        const ocupProducto = ocupsDeCamara.filter(
            (o) => Number(o.tipo_ocupacion) === 1
        );
        const tarOcup = ocupProducto.reduce(
            (s, o) => s + (Number(o.cantidad_tarimas) || 0),
            0
        );
        const cajOcup = ocupProducto.reduce(
            (s, o) => s + (Number(o.cantidad_cajas) || 0),
            0
        );
        const bloOcup = ocupProducto.reduce(
            (s, o) => s + (Number(o.cantidad_bloques) || 0),
            0
        );

        const tarMax = Number(cam.capacidad_max_tarimas) || 0;
        const cajMax = Number(cam.capacidad_max_cajas) || 0;
        const bloMax = Number(cam.capacidad_max_bloques) || 0;

        const pct = (ocup, max) =>
            max > 0 ? Math.min(100, Math.round((ocup / max) * 100)) : 0;

        return {
            id_camara: cam.id_camara,
            nombre_camara: cam.nombre_camara,
            tipo_camara: Number(cam.tipo_camara),
            ubicacion: cam.ubicacion,
            enMantenimiento,
            tarimas: {
                ocup: tarOcup,
                max: tarMax,
                disp: Math.max(0, tarMax - tarOcup),
                pct: pct(tarOcup, tarMax)
            },
            cajas: {
                ocup: cajOcup,
                max: cajMax,
                disp: Math.max(0, cajMax - cajOcup),
                pct: pct(cajOcup, cajMax)
            },
            bloques: {
                ocup: bloOcup,
                max: bloMax,
                disp: Math.max(0, bloMax - bloOcup),
                pct: pct(bloOcup, bloMax)
            }
        };
    });
});

// Nombre de cámara por id (para la tabla)
const nombreCamara = (id) => {
    const c = camaras.value.find(
        (x) => Number(x.id_camara) === Number(id)
    );
    return c ? c.nombre_camara : `Cámara ${id}`;
};

// Clase de color según % de ocupación
const nivelClase = (pct) => {
    if (pct >= 90) return "nivel-alto";
    if (pct >= 60) return "nivel-medio";
    return "nivel-bajo";
};

// ---------- Cargar datos ----------
const cargarDatos = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        const [cams, activas] = await Promise.all([
            camarasService.getCamaras(),
            ocupacionesService.getOcupacionesActivas()
        ]);
        camaras.value = cams;
        ocupacionesActivas.value = activas;
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar los datos de ocupación.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarDatos);

// ---------- Filtro de la tabla de ocupaciones activas ----------
const ocupacionesFiltradas = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    if (!q) return ocupacionesActivas.value;
    return ocupacionesActivas.value.filter((o) => {
        return (
            nombreCamara(o.id_camara).toLowerCase().includes(q) ||
            tipoOcupLabel(o.tipo_ocupacion).toLowerCase().includes(q) ||
            (o.observaciones || "").toLowerCase().includes(q)
        );
    });
});

// ---------- Abrir modal CREAR ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        id_camara: "",
        tipo_ocupacion: 1,
        fecha_inicio: "",
        hora_inicio: "",
        cantidad_tarimas: 0,
        cantidad_cajas: 0,
        cantidad_bloques: 0,
        id_mantenimiento: null,
        observaciones: ""
    });
    modalAbierto.value = true;
};

// ---------- Abrir modal EDITAR ----------
const abrirEditar = (ocup) => {
    modoEdicion.value = true;
    idEditando.value = ocup.id_ocupacion;
    errorForm.value = "";
    Object.assign(form, {
        id_camara: ocup.id_camara ?? "",
        tipo_ocupacion: Number(ocup.tipo_ocupacion) || 1,
        fecha_inicio: (ocup.fecha_inicio || "").substring(0, 10),
        hora_inicio: ocup.hora_inicio ?? "",
        cantidad_tarimas: ocup.cantidad_tarimas ?? 0,
        cantidad_cajas: ocup.cantidad_cajas ?? 0,
        cantidad_bloques: ocup.cantidad_bloques ?? 0,
        id_mantenimiento: ocup.id_mantenimiento ?? null,
        observaciones: ocup.observaciones ?? ""
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
        errorForm.value = "Cámara, fecha y hora de inicio son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const esMantenimiento = Number(form.tipo_ocupacion) === 2;
        const payload = {
            id_camara: Number(form.id_camara),
            fecha_inicio: form.fecha_inicio,
            hora_inicio: form.hora_inicio,
            // En creación el estado es 1 (activa). En edición lo mantenemos activa.
            estado: 1,
            tipo_ocupacion: Number(form.tipo_ocupacion),
            cantidad_tarimas: esMantenimiento
                ? 0
                : Number(form.cantidad_tarimas) || 0,
            cantidad_cajas: esMantenimiento
                ? 0
                : Number(form.cantidad_cajas) || 0,
            cantidad_bloques: esMantenimiento
                ? 0
                : Number(form.cantidad_bloques) || 0,
            id_mantenimiento:
                form.id_mantenimiento === "" ||
                form.id_mantenimiento === null
                    ? null
                    : Number(form.id_mantenimiento),
            observaciones: form.observaciones?.trim() || null
        };

        if (modoEdicion.value) {
            await ocupacionesService.actualizarOcupacion(
                idEditando.value,
                payload
            );
        } else {
            await ocupacionesService.crearOcupacion(payload);
        }
        cerrarModal();
        await cargarDatos();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar la ocupación.";
    } finally {
        guardando.value = false;
    }
};

// ---------- Abrir modal CERRAR ----------
const abrirCierre = (ocup) => {
    ocupacionCerrar.value = ocup;
    errorCierre.value = "";
    const hoy = new Date();
    formCierre.fecha_fin = hoy.toISOString().substring(0, 10);
    formCierre.hora_fin = hoy.toTimeString().substring(0, 5);
    modalCierre.value = true;
};

const cerrarModalCierre = () => {
    modalCierre.value = false;
};

// ---------- Confirmar cierre ----------
const confirmarCierre = async () => {
    errorCierre.value = "";
    if (!cierreValido.value) {
        errorCierre.value = "La fecha y hora de fin son obligatorias.";
        return;
    }
    cerrando.value = true;
    try {
        await ocupacionesService.cerrarOcupacion(
            ocupacionCerrar.value.id_ocupacion,
            {
                fecha_fin: formCierre.fecha_fin,
                hora_fin: formCierre.hora_fin
            }
        );
        cerrarModalCierre();
        await cargarDatos();
    } catch (error) {
        errorCierre.value =
            error?.response?.data?.error ||
            "No se pudo cerrar la ocupación.";
    } finally {
        cerrando.value = false;
    }
};

// ---------- Eliminar ----------
const eliminar = async (ocup) => {
    const ok = window.confirm(
        `¿Eliminar la ocupación #${ocup.id_ocupacion} de ${nombreCamara(ocup.id_camara)}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
        await ocupacionesService.eliminarOcupacion(ocup.id_ocupacion);
        await cargarDatos();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar la ocupación.";
    }
};

const hayAcciones = computed(
    () => canEdit.value || canDelete.value
);
</script>

<template>
    <section class="ocup-view">
        <!-- Encabezado -->
        <div class="ocup-header">
            <div>
                <h2>📦 Ocupación de cámaras</h2>
                <p class="ocup-subtitle">
                    Disponibilidad de cámaras de preenfrío y conservación por capacidad y mantenimiento.
                </p>
            </div>
            <button
                v-if="canCreate"
                class="ocup-btn-nueva"
                @click="abrirCrear"
            >
                ➕ Nueva ocupación
            </button>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="ocup-estado">Cargando información…</div>
        <div v-else-if="errorMsg" class="ocup-estado error">{{ errorMsg }}</div>

        <template v-else>
            <!-- ===== DISPONIBILIDAD (tarjetas por cámara) ===== -->
            <div class="ocup-seccion-head">
                <h3 class="ocup-seccion">🧊 Disponibilidad de cámaras</h3>
                <div class="ocup-filtros">
                    <button
                        class="filtro-btn"
                        :class="{ activo: filtroTipo === 'todas' }"
                        @click="filtroTipo = 'todas'"
                    >
                        Todas
                    </button>
                    <button
                        class="filtro-btn"
                        :class="{ activo: filtroTipo === '1' }"
                        @click="filtroTipo = '1'"
                    >
                        Preenfrío
                    </button>
                    <button
                        class="filtro-btn"
                        :class="{ activo: filtroTipo === '2' }"
                        @click="filtroTipo = '2'"
                    >
                        Conservación
                    </button>
                </div>
            </div>

            <div
                v-if="disponibilidad.length === 0"
                class="ocup-estado"
            >
                No hay cámaras registradas para este filtro.
            </div>
            <div v-else class="disp-grid">
                <div
                    v-for="d in disponibilidad"
                    :key="d.id_camara"
                    class="disp-card"
                    :class="{ 'en-mantenimiento': d.enMantenimiento }"
                >
                    <div class="disp-card-head">
                        <div class="disp-nombre">🧊 {{ d.nombre_camara }}</div>
                        <span
                            v-if="d.enMantenimiento"
                            class="badge-mant"
                        >
                            🔧 Mantenimiento
                        </span>
                        <span v-else class="badge-operativa">
                            ✓ Operativa
                        </span>
                    </div>
                    <div class="disp-meta">
                        <span
                            class="badge-tipocam"
                            :class="d.tipo_camara === 1 ? 'tc-pre' : 'tc-con'"
                        >
                            {{ tipoCamaraLabel(d.tipo_camara) }}
                        </span>
                        <span class="disp-ubi" v-if="d.ubicacion">
                            📍 {{ d.ubicacion }}
                        </span>
                    </div>

                    <!-- Barras de capacidad -->
                    <div class="cap-row">
                        <div class="cap-label">
                            <span>🟫 Tarimas</span>
                            <span class="cap-cifra">
                                {{ d.tarimas.disp }} / {{ d.tarimas.max }} libres
                            </span>
                        </div>
                        <div class="cap-bar">
                            <div
                                class="cap-fill"
                                :class="nivelClase(d.tarimas.pct)"
                                :style="{ width: d.tarimas.pct + '%' }"
                            ></div>
                        </div>
                    </div>

                    <div class="cap-row">
                        <div class="cap-label">
                            <span>📦 Cajas</span>
                            <span class="cap-cifra">
                                {{ d.cajas.disp }} / {{ d.cajas.max }} libres
                            </span>
                        </div>
                        <div class="cap-bar">
                            <div
                                class="cap-fill"
                                :class="nivelClase(d.cajas.pct)"
                                :style="{ width: d.cajas.pct + '%' }"
                            ></div>
                        </div>
                    </div>

                    <div class="cap-row">
                        <div class="cap-label">
                            <span>🧱 Bloques</span>
                            <span class="cap-cifra">
                                {{ d.bloques.disp }} / {{ d.bloques.max }} libres
                            </span>
                        </div>
                        <div class="cap-bar">
                            <div
                                class="cap-fill"
                                :class="nivelClase(d.bloques.pct)"
                                :style="{ width: d.bloques.pct + '%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== TABLA DE OCUPACIONES ACTIVAS ===== -->
            <h3 class="ocup-seccion">📋 Ocupaciones activas</h3>

            <div class="ocup-toolbar">
                <input
                    v-model="busqueda"
                    type="text"
                    class="ocup-buscar"
                    placeholder="🔍 Buscar por cámara, tipo, observación…"
                />
                <span class="ocup-conteo">
                    {{ ocupacionesFiltradas.length }} de {{ ocupacionesActivas.length }} activas
                </span>
            </div>

            <div
                v-if="ocupacionesActivas.length === 0"
                class="ocup-estado"
            >
                No hay ocupaciones activas en este momento.
            </div>
            <div
                v-else-if="ocupacionesFiltradas.length === 0"
                class="ocup-estado"
            >
                No se encontraron ocupaciones para "{{ busqueda }}".
            </div>

            <div v-else class="ocup-tabla-wrap">
                <table class="ocup-tabla">
                    <thead>
                        <tr>
                            <th>Cámara</th>
                            <th class="col-centro">Tipo</th>
                            <th class="col-centro">Inicio</th>
                            <th class="col-centro">Tarimas</th>
                            <th class="col-centro">Cajas</th>
                            <th class="col-centro">Bloques</th>
                            <th>Observaciones</th>
                            <th v-if="hayAcciones" class="col-centro">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="o in ocupacionesFiltradas"
                            :key="o.id_ocupacion"
                        >
                            <td>{{ nombreCamara(o.id_camara) }}</td>
                            <td class="col-centro">
                                <span
                                    class="badge-tipo-ocup"
                                    :class="Number(o.tipo_ocupacion) === 2 ? 'mant' : 'prod'"
                                >
                                    {{ tipoOcupLabel(o.tipo_ocupacion) }}
                                </span>
                            </td>
                            <td class="col-centro">
                                {{ (o.fecha_inicio || "").substring(0, 10) }}
                                <small>{{ (o.hora_inicio || "").substring(0, 5) }}</small>
                            </td>
                            <td class="col-centro">{{ o.cantidad_tarimas ?? 0 }}</td>
                            <td class="col-centro">{{ o.cantidad_cajas ?? 0 }}</td>
                            <td class="col-centro">{{ o.cantidad_bloques ?? 0 }}</td>
                            <td>{{ o.observaciones || "—" }}</td>
                            <td v-if="hayAcciones" class="col-centro">
                                <div class="acciones">
                                    <button
                                        v-if="canEdit"
                                        class="btn-icono cerrar"
                                        title="Cerrar ocupación"
                                        @click="abrirCierre(o)"
                                    >
                                        ✅
                                    </button>
                                    <button
                                        v-if="canEdit"
                                        class="btn-icono editar"
                                        title="Editar"
                                        @click="abrirEditar(o)"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        v-if="canDelete"
                                        class="btn-icono eliminar"
                                        title="Eliminar"
                                        @click="eliminar(o)"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <!-- ===== MODAL CREAR / EDITAR ===== -->
        <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modoEdicion ? "✏️ Editar ocupación" : "➕ Nueva ocupación" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <label>
                        Cámara *
                        <select v-model="form.id_camara">
                            <option value="" disabled>Selecciona una cámara…</option>
                            <option
                                v-for="c in camaras"
                                :key="c.id_camara"
                                :value="c.id_camara"
                            >
                                {{ c.nombre_camara }} · {{ tipoCamaraLabel(c.tipo_camara) }}
                            </option>
                        </select>
                    </label>

                    <label>
                        Tipo de ocupación *
                        <select v-model.number="form.tipo_ocupacion">
                            <option :value="1">Producto / Inventario</option>
                            <option :value="2">Mantenimiento</option>
                        </select>
                    </label>

                    <div class="grid-2">
                        <label>
                            Fecha de inicio *
                            <input v-model="form.fecha_inicio" type="date" />
                        </label>
                        <label>
                            Hora de inicio *
                            <input v-model="form.hora_inicio" type="time" />
                        </label>
                    </div>

                    <!-- Cantidades solo si es ocupación por producto -->
                    <div v-if="Number(form.tipo_ocupacion) === 1" class="grid-3">
                        <label>
                            Tarimas
                            <input
                                v-model="form.cantidad_tarimas"
                                type="number"
                                min="0"
                            />
                        </label>
                        <label>
                            Cajas
                            <input
                                v-model="form.cantidad_cajas"
                                type="number"
                                min="0"
                            />
                        </label>
                        <label>
                            Bloques
                            <input
                                v-model="form.cantidad_bloques"
                                type="number"
                                min="0"
                            />
                        </label>
                    </div>

                    <!-- ID de mantenimiento solo si es mantenimiento -->
                    <label v-if="Number(form.tipo_ocupacion) === 2">
                        ID de mantenimiento (opcional)
                        <input
                            v-model="form.id_mantenimiento"
                            type="number"
                            min="0"
                            placeholder="Ej. 5"
                        />
                    </label>

                    <label>
                        Observaciones
                        <input
                            v-model="form.observaciones"
                            type="text"
                            maxlength="200"
                            placeholder="Opcional"
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

        <!-- ===== MODAL CERRAR OCUPACIÓN ===== -->
        <div v-if="modalCierre" class="modal-overlay" @click.self="cerrarModalCierre">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <h3>✅ Cerrar ocupación</h3>
                    <button class="modal-close" @click="cerrarModalCierre">✕</button>
                </div>

                <div class="modal-body">
                    <p class="cierre-info">
                        Vas a liberar la cámara
                        <b>{{ nombreCamara(ocupacionCerrar?.id_camara) }}</b>.
                        Indica cuándo terminó la ocupación:
                    </p>
                    <div class="grid-2">
                        <label>
                            Fecha de fin *
                            <input v-model="formCierre.fecha_fin" type="date" />
                        </label>
                        <label>
                            Hora de fin *
                            <input v-model="formCierre.hora_fin" type="time" />
                        </label>
                    </div>
                    <p v-if="errorCierre" class="form-error">{{ errorCierre }}</p>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancelar" @click="cerrarModalCierre">
                        Cancelar
                    </button>
                    <button
                        class="btn-guardar"
                        :disabled="cerrando || !cierreValido"
                        @click="confirmarCierre"
                    >
                        {{ cerrando ? "Cerrando…" : "Cerrar ocupación" }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
