<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./produccion.css.
//
// Vista de PRODUCCIÓN (plan logístico) en formato TABLA con:
//  - Filtros: texto libre, por día, por semana, por mes, por estado.
//  - Alta uno por uno (modal con dropdowns de catálogos).
//  - Carga masiva por Excel (usa SheetJS/xlsx; mapea códigos -> IDs).
//
// NOTA: 'calidad' ya no es columna de produccion; se toma del SKU
// (calidad_sku) solo para mostrar en la tabla.
//
// Requiere instalar SheetJS en el frontend:  npm install xlsx --legacy-peer-deps
import { ref, reactive, computed, onMounted } from "vue";
import * as XLSX from "xlsx";
import { useAuth } from "../../composables/useAuth.js";
import { produccionService } from "../../services/produccion.service.js";
import { fincasService } from "../../services/fincas.service.js";
import { productoresService } from "../../services/productores.service.js";
import { skuService } from "../../services/sku.service.js";
import { cedisClienteService } from "../../services/cedisCliente.service.js";
import { camarasService } from "../../services/camaras.service.js";
import "./produccion.css";

const { puedeCrear, puedeEditar, puedeEliminar } = useAuth();

const canCreate = computed(() => puedeCrear("produccion"));
const canEdit = computed(() => puedeEditar("produccion"));
const canDelete = computed(() => puedeEliminar("produccion"));
const hayAcciones = computed(() => canEdit.value || canDelete.value);

// Estados de producción
const ESTADOS = {
    0: "Cancelada",
    1: "Planeada",
    2: "En recepción",
    3: "Recibida"
};
const estadoLabel = (e) => ESTADOS[Number(e)] || "—";

// ---------- Estado ----------
const producciones = ref([]);
const cargando = ref(false);
const errorMsg = ref("");

// Catálogos para dropdowns y para mapear el Excel
const fincas = ref([]);
const productores = ref([]);
const skus = ref([]);
const cedis = ref([]);
const camaras = ref([]);

// ---------- Filtros ----------
const busqueda = ref("");
const filtroModo = ref("todos"); // todos | dia | semana | mes
const filtroDia = ref("");
const filtroSemana = ref("");
const filtroMes = ref(""); // formato AAAA-MM
const filtroEstado = ref("todos");

// ---------- Modal alta/edición ----------
const modalAbierto = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const idEditando = ref(null);

const form = reactive({
    semana: "",
    region: "",
    id_finca: "",
    id_productor: "",
    fecha_empaque: "",
    transito: null,
    fecha_entrega: "",
    id_cc: "",
    id_sku: "",
    cajas_procesadas: 0,
    estiba_pallets: 0,
    comentarios: "",
    id_camara: "",
    estado: 1
});

const formValido = computed(
    () =>
        form.semana !== "" &&
        form.id_finca !== "" &&
        form.id_productor !== "" &&
        form.fecha_empaque !== "" &&
        form.id_cc !== "" &&
        form.id_sku !== ""
);

// ---------- Modal carga Excel ----------
const modalExcel = ref(false);
const importando = ref(false);
const progresoActual = ref(0);
const progresoTotal = ref(0);
const filasPreview = ref([]);
const erroresPreview = ref([]);
const resultadoImport = ref(null);

// ---------- Cargar datos ----------
const cargarProducciones = async () => {
    cargando.value = true;
    errorMsg.value = "";
    try {
        producciones.value = await produccionService.getProducciones();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudieron cargar las producciones.";
    } finally {
        cargando.value = false;
    }
};

const cargarCatalogos = async () => {
    try {
        const [f, p, s, c, cam] = await Promise.all([
            fincasService.getFincas(),
            productoresService.getProductores(),
            skuService.getSkus(),
            cedisClienteService.getCedisClientes(),
            camarasService.getCamaras()
        ]);
        fincas.value = f;
        productores.value = p;
        skus.value = s;
        cedis.value = c;
        camaras.value = cam;
    } catch (error) {
        console.error("No se pudieron cargar los catálogos:", error);
    }
};

onMounted(async () => {
    await Promise.all([cargarProducciones(), cargarCatalogos()]);
});

// ---------- Filtro combinado ----------
const produccionesFiltradas = computed(() => {
    let lista = producciones.value;

    if (filtroEstado.value !== "todos") {
        lista = lista.filter(
            (p) => Number(p.estado) === Number(filtroEstado.value)
        );
    }

    if (filtroModo.value === "dia" && filtroDia.value) {
        lista = lista.filter(
            (p) => (p.fecha_empaque || "").substring(0, 10) === filtroDia.value
        );
    } else if (filtroModo.value === "semana" && filtroSemana.value) {
        lista = lista.filter(
            (p) => Number(p.semana) === Number(filtroSemana.value)
        );
    } else if (filtroModo.value === "mes" && filtroMes.value) {
        lista = lista.filter(
            (p) => (p.fecha_empaque || "").substring(0, 7) === filtroMes.value
        );
    }

    const q = busqueda.value.trim().toLowerCase();
    if (q) {
        lista = lista.filter((p) => {
            return (
                (p.nombre_finca || "").toLowerCase().includes(q) ||
                (p.codigo_finca || "").toLowerCase().includes(q) ||
                (p.nombre_productor || "").toLowerCase().includes(q) ||
                (p.codigo_sku || "").toLowerCase().includes(q) ||
                (p.cliente || "").toLowerCase().includes(q) ||
                (p.cedis || "").toLowerCase().includes(q) ||
                (p.region || "").toLowerCase().includes(q) ||
                (p.nombre_camara || "").toLowerCase().includes(q)
            );
        });
    }

    return lista;
});

const totalCajas = computed(() =>
    produccionesFiltradas.value.reduce(
        (s, p) => s + (Number(p.cajas_procesadas) || 0),
        0
    )
);
const totalTarimas = computed(() =>
    produccionesFiltradas.value.reduce(
        (s, p) => s + (Number(p.estiba_pallets) || 0),
        0
    )
);

const limpiarFiltros = () => {
    busqueda.value = "";
    filtroModo.value = "todos";
    filtroDia.value = "";
    filtroSemana.value = "";
    filtroMes.value = "";
    filtroEstado.value = "todos";
};

// ---------- Modal alta ----------
const abrirCrear = () => {
    modoEdicion.value = false;
    idEditando.value = null;
    errorForm.value = "";
    Object.assign(form, {
        semana: "",
        region: "",
        id_finca: "",
        id_productor: "",
        fecha_empaque: "",
        transito: null,
        fecha_entrega: "",
        id_cc: "",
        id_sku: "",
        cajas_procesadas: 0,
        estiba_pallets: 0,
        comentarios: "",
        id_camara: "",
        estado: 1
    });
    modalAbierto.value = true;
};

const abrirEditar = (p) => {
    modoEdicion.value = true;
    idEditando.value = p.id_produccion;
    errorForm.value = "";
    Object.assign(form, {
        semana: p.semana ?? "",
        region: p.region ?? "",
        id_finca: p.id_finca ?? "",
        id_productor: p.id_productor ?? "",
        fecha_empaque: (p.fecha_empaque || "").substring(0, 10),
        transito: p.transito ?? null,
        fecha_entrega: (p.fecha_entrega || "").substring(0, 10),
        id_cc: p.id_cc ?? "",
        id_sku: p.id_sku ?? "",
        cajas_procesadas: p.cajas_procesadas ?? 0,
        estiba_pallets: p.estiba_pallets ?? 0,
        comentarios: p.comentarios ?? "",
        id_camara: p.id_camara ?? "",
        estado: p.estado ?? 1
    });
    modalAbierto.value = true;
};

const cerrarModal = () => {
    modalAbierto.value = false;
};

const construirPayload = () => ({
    semana: Number(form.semana),
    region: form.region?.trim() || null,
    id_finca: Number(form.id_finca),
    id_productor: Number(form.id_productor),
    fecha_empaque: form.fecha_empaque,
    transito:
        form.transito === "" || form.transito === null
            ? null
            : Number(form.transito),
    fecha_entrega: form.fecha_entrega || null,
    id_cc: Number(form.id_cc),
    id_sku: Number(form.id_sku),
    cajas_procesadas: Number(form.cajas_procesadas) || 0,
    estiba_pallets: Number(form.estiba_pallets) || 0,
    comentarios: form.comentarios?.trim() || null,
    id_camara: form.id_camara === "" ? null : Number(form.id_camara),
    estado: Number(form.estado)
});

const guardar = async () => {
    errorForm.value = "";
    if (!formValido.value) {
        errorForm.value =
            "Semana, finca, productor, fecha de empaque, cliente y SKU son obligatorios.";
        return;
    }
    guardando.value = true;
    try {
        const payload = construirPayload();
        if (modoEdicion.value) {
            await produccionService.actualizarProduccion(
                idEditando.value,
                payload
            );
        } else {
            await produccionService.crearProduccion(payload);
        }
        cerrarModal();
        await cargarProducciones();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error ||
            "No se pudo guardar la producción.";
    } finally {
        guardando.value = false;
    }
};

const eliminar = async (p) => {
    const ok = window.confirm(
        `¿Eliminar la producción #${p.id_produccion} (${p.nombre_finca} · ${p.codigo_sku})?`
    );
    if (!ok) return;
    try {
        await produccionService.eliminarProduccion(p.id_produccion);
        await cargarProducciones();
    } catch (error) {
        errorMsg.value =
            error?.response?.data?.error ||
            "No se pudo eliminar la producción.";
    }
};

// =========================================================
// CARGA MASIVA POR EXCEL
// =========================================================
const abrirExcel = () => {
    filasPreview.value = [];
    erroresPreview.value = [];
    resultadoImport.value = null;
    progresoActual.value = 0;
    progresoTotal.value = 0;
    modalExcel.value = true;
};

const cerrarExcel = () => {
    modalExcel.value = false;
};

// Descarga la plantilla generándola en el momento con SheetJS (sin calidad)
const descargarPlantilla = () => {
    const encabezados = [
        "semana",
        "region",
        "codigo_finca",
        "codigo_productor",
        "fecha_empaque",
        "transito",
        "fecha_entrega",
        "acronimo_cc",
        "codigo_sku",
        "cajas_procesadas",
        "estiba_pallets",
        "comentarios",
        "nombre_camara"
    ];
    const ejemplo = [
        34, "Chiapas", "001", "A01", "2026-08-20", 4, "2026-08-24",
        "WMT-CEDA", "CPR01102", 1152, 24, "24 convencional", "Camara 1"
    ];
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produccion");
    XLSX.writeFile(wb, "plantilla_produccion.xlsx");
};

// Helpers de mapeo código -> id
const buscarFinca = (codigo) =>
    fincas.value.find(
        (f) =>
            String(f.codigo_finca).trim().toLowerCase() ===
            String(codigo).trim().toLowerCase()
    );
const buscarProductor = (codigo) =>
    productores.value.find(
        (p) =>
            String(p.codigo_productor).trim().toLowerCase() ===
            String(codigo).trim().toLowerCase()
    );
const buscarSku = (codigo) =>
    skus.value.find(
        (s) =>
            String(s.codigo_sku).trim().toLowerCase() ===
            String(codigo).trim().toLowerCase()
    );
const buscarCedis = (acronimo) =>
    cedis.value.find(
        (c) =>
            String(c.acronimo).trim().toLowerCase() ===
            String(acronimo).trim().toLowerCase()
    );
const buscarCamara = (nombre) =>
    camaras.value.find(
        (c) =>
            String(c.nombre_camara).trim().toLowerCase() ===
            String(nombre).trim().toLowerCase()
    );

const normalizarFecha = (valor) => {
    if (!valor && valor !== 0) return null;
    if (typeof valor === "number") {
        const d = XLSX.SSF.parse_date_code(valor);
        if (!d) return null;
        const mm = String(d.m).padStart(2, "0");
        const dd = String(d.d).padStart(2, "0");
        return `${d.y}-${mm}-${dd}`;
    }
    return String(valor).substring(0, 10);
};

const onArchivo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    filasPreview.value = [];
    erroresPreview.value = [];
    resultadoImport.value = null;

    try {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const hoja = wb.Sheets["Produccion"] || wb.Sheets[wb.SheetNames[0]];
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });

        const validas = [];
        const errores = [];

        filas.forEach((row, idx) => {
            const numFila = idx + 2;
            const finca = buscarFinca(row.codigo_finca);
            const productor = buscarProductor(row.codigo_productor);
            const sku = buscarSku(row.codigo_sku);
            const cc = buscarCedis(row.acronimo_cc);
            const camara = row.nombre_camara
                ? buscarCamara(row.nombre_camara)
                : null;

            const problemas = [];
            if (!row.semana || isNaN(Number(row.semana)))
                problemas.push("semana inválida");
            if (!finca) problemas.push(`finca '${row.codigo_finca}' no existe`);
            if (!productor)
                problemas.push(`productor '${row.codigo_productor}' no existe`);
            if (!sku) problemas.push(`SKU '${row.codigo_sku}' no existe`);
            if (!cc) problemas.push(`cliente '${row.acronimo_cc}' no existe`);
            if (!row.fecha_empaque) problemas.push("falta fecha_empaque");
            if (row.nombre_camara && !camara)
                problemas.push(`cámara '${row.nombre_camara}' no existe`);

            if (problemas.length > 0) {
                errores.push({ fila: numFila, mensaje: problemas.join("; ") });
                return;
            }

            validas.push({
                _fila: numFila,
                _resumen: `${finca.codigo_finca} · ${sku.codigo_sku} · ${cc.acronimo}`,
                semana: Number(row.semana),
                region: String(row.region || "").trim() || null,
                id_finca: finca.id_finca,
                id_productor: productor.id_productor,
                fecha_empaque: normalizarFecha(row.fecha_empaque),
                transito:
                    row.transito === "" || row.transito === null
                        ? null
                        : Number(row.transito),
                fecha_entrega: row.fecha_entrega
                    ? normalizarFecha(row.fecha_entrega)
                    : null,
                id_cc: cc.id_cc,
                id_sku: sku.id_sku,
                cajas_procesadas: Number(row.cajas_procesadas) || 0,
                estiba_pallets: Number(row.estiba_pallets) || 0,
                comentarios: String(row.comentarios || "").trim() || null,
                id_camara: camara ? camara.id_camara : null,
                estado: 1
            });
        });

        filasPreview.value = validas;
        erroresPreview.value = errores;
    } catch (error) {
        erroresPreview.value = [
            { fila: "-", mensaje: "No se pudo leer el archivo Excel." }
        ];
    } finally {
        event.target.value = "";
    }
};

const confirmarImport = async () => {
    if (filasPreview.value.length === 0) return;
    importando.value = true;
    progresoActual.value = 0;
    progresoTotal.value = filasPreview.value.length;
    const payload = filasPreview.value.map(({ _fila, _resumen, ...rest }) => rest);
    try {
        const res = await produccionService.crearMasivo(
            payload,
            (actual) => {
                progresoActual.value = actual;
            }
        );
        resultadoImport.value = res;
        await cargarProducciones();
    } catch (error) {
        erroresPreview.value.push({
            fila: "-",
            mensaje: "Error general durante la importación."
        });
    } finally {
        importando.value = false;
    }
};
</script>

<template>
    <section class="prod-view">
        <!-- Encabezado -->
        <div class="prod-header">
            <div>
                <h2>🏭 Producción</h2>
                <p class="prod-subtitle">
                    Plan logístico diario. Alta manual o carga masiva por Excel.
                </p>
            </div>
            <div class="prod-header-btns">
                <button
                    v-if="canCreate"
                    class="prod-btn-excel"
                    @click="abrirExcel"
                >
                    📄 Cargar Excel
                </button>
                <button
                    v-if="canCreate"
                    class="prod-btn-nueva"
                    @click="abrirCrear"
                >
                    ➕ Nueva producción
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="prod-filtros">
            <input
                v-model="busqueda"
                type="text"
                class="prod-buscar"
                placeholder="🔍 Buscar por finca, productor, SKU, cliente, región…"
            />

            <select v-model="filtroModo" class="prod-select">
                <option value="todos">Todas las fechas</option>
                <option value="dia">Por día</option>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
            </select>

            <input
                v-if="filtroModo === 'dia'"
                v-model="filtroDia"
                type="date"
                class="prod-select"
            />
            <input
                v-if="filtroModo === 'semana'"
                v-model="filtroSemana"
                type="number"
                min="1"
                max="53"
                placeholder="Semana"
                class="prod-select"
            />
            <input
                v-if="filtroModo === 'mes'"
                v-model="filtroMes"
                type="month"
                class="prod-select"
            />

            <select v-model="filtroEstado" class="prod-select">
                <option value="todos">Todos los estados</option>
                <option value="1">Planeada</option>
                <option value="2">En recepción</option>
                <option value="3">Recibida</option>
                <option value="0">Cancelada</option>
            </select>

            <button class="prod-btn-limpiar" @click="limpiarFiltros">
                Limpiar
            </button>
        </div>

        <div class="prod-conteo-row">
            <span class="prod-conteo">
                {{ produccionesFiltradas.length }} de {{ producciones.length }} registros
            </span>
            <span class="prod-totales">
                Σ Cajas: <b>{{ totalCajas }}</b> · Σ Tarimas: <b>{{ totalTarimas }}</b>
            </span>
        </div>

        <!-- Estados -->
        <div v-if="cargando" class="prod-estado">Cargando producciones…</div>
        <div v-else-if="errorMsg" class="prod-estado error">{{ errorMsg }}</div>
        <div v-else-if="producciones.length === 0" class="prod-estado">
            No hay producciones registradas todavía.
        </div>
        <div
            v-else-if="produccionesFiltradas.length === 0"
            class="prod-estado"
        >
            No se encontraron producciones con los filtros aplicados.
        </div>

        <!-- Tabla -->
        <div v-else class="prod-tabla-wrap">
            <table class="prod-tabla">
                <thead>
                    <tr>
                        <th class="col-centro">Sem</th>
                        <th>Región</th>
                        <th>Finca</th>
                        <th>Productor</th>
                        <th class="col-centro">Empaque</th>
                        <th>Cliente / Cedis</th>
                        <th>SKU</th>
                        <th class="col-centro">Cajas</th>
                        <th class="col-centro">Tarimas</th>
                        <th>Preenfrío</th>
                        <th class="col-centro">Estado</th>
                        <th v-if="hayAcciones" class="col-centro">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in produccionesFiltradas" :key="p.id_produccion">
                        <td class="col-centro">{{ p.semana }}</td>
                        <td>{{ p.region || "—" }}</td>
                        <td>
                            <span class="cod-pill">{{ p.codigo_finca }}</span>
                            {{ p.nombre_finca }}
                        </td>
                        <td>{{ p.nombre_productor }}</td>
                        <td class="col-centro">
                            {{ (p.fecha_empaque || "").substring(0, 10) }}
                        </td>
                        <td>
                            <b>{{ p.cliente }}</b>
                            <small>{{ p.cedis }}</small>
                        </td>
                        <td>
                            {{ p.codigo_sku }}
                            <small>{{ p.calidad_sku }}</small>
                        </td>
                        <td class="col-centro">{{ p.cajas_procesadas }}</td>
                        <td class="col-centro">{{ p.estiba_pallets }}</td>
                        <td>
                            <span v-if="p.nombre_camara" class="pill-pre">
                                🧊 {{ p.nombre_camara }}
                            </span>
                            <span v-else class="pill-directo">Directo</span>
                        </td>
                        <td class="col-centro">
                            <span
                                class="badge-estado"
                                :class="'est-' + Number(p.estado)"
                            >
                                {{ estadoLabel(p.estado) }}
                            </span>
                        </td>
                        <td v-if="hayAcciones" class="col-centro">
                            <div class="acciones">
                                <button
                                    v-if="canEdit"
                                    class="btn-icono editar"
                                    title="Editar"
                                    @click="abrirEditar(p)"
                                >
                                    ✏️
                                </button>
                                <button
                                    v-if="canDelete"
                                    class="btn-icono eliminar"
                                    title="Eliminar"
                                    @click="eliminar(p)"
                                >
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ===== MODAL ALTA / EDICIÓN ===== -->
        <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modoEdicion ? "✏️ Editar producción" : "➕ Nueva producción" }}</h3>
                    <button class="modal-close" @click="cerrarModal">✕</button>
                </div>

                <div class="modal-body">
                    <div class="grid-2">
                        <label>
                            Semana *
                            <input v-model="form.semana" type="number" min="1" max="53" />
                        </label>
                        <label>
                            Región
                            <input v-model="form.region" type="text" maxlength="60" />
                        </label>
                    </div>

                    <label>
                        Finca *
                        <select v-model="form.id_finca">
                            <option value="" disabled>Selecciona una finca…</option>
                            <option
                                v-for="f in fincas"
                                :key="f.id_finca"
                                :value="f.id_finca"
                            >
                                {{ f.codigo_finca }} · {{ f.nombre }}
                            </option>
                        </select>
                    </label>

                    <label>
                        Productor *
                        <select v-model="form.id_productor">
                            <option value="" disabled>Selecciona un productor…</option>
                            <option
                                v-for="pr in productores"
                                :key="pr.id_productor"
                                :value="pr.id_productor"
                            >
                                {{ pr.codigo_productor }} · {{ pr.nombre }}
                            </option>
                        </select>
                    </label>

                    <div class="grid-2">
                        <label>
                            Fecha de empaque *
                            <input v-model="form.fecha_empaque" type="date" />
                        </label>
                        <label>
                            Fecha de entrega
                            <input v-model="form.fecha_entrega" type="date" />
                        </label>
                    </div>

                    <label>
                        Cliente / Cedis *
                        <select v-model="form.id_cc">
                            <option value="" disabled>Selecciona un cliente…</option>
                            <option
                                v-for="c in cedis"
                                :key="c.id_cc"
                                :value="c.id_cc"
                            >
                                {{ c.acronimo }} · {{ c.cliente }} ({{ c.cedis }})
                            </option>
                        </select>
                    </label>

                    <label>
                        SKU *
                        <select v-model="form.id_sku">
                            <option value="" disabled>Selecciona un SKU…</option>
                            <option
                                v-for="s in skus"
                                :key="s.id_sku"
                                :value="s.id_sku"
                            >
                                {{ s.codigo_sku }} · {{ s.calidad }}
                            </option>
                        </select>
                    </label>

                    <div class="grid-3">
                        <label>
                            Tránsito (días)
                            <input v-model="form.transito" type="number" min="0" />
                        </label>
                        <label>
                            Cajas procesadas
                            <input v-model="form.cajas_procesadas" type="number" min="0" />
                        </label>
                        <label>
                            Estiba (pallets)
                            <input v-model="form.estiba_pallets" type="number" min="0" />
                        </label>
                    </div>

                    <label>
                        Preenfrío (cámara)
                        <select v-model="form.id_camara">
                            <option value="">Directo (no se preenfría)</option>
                            <option
                                v-for="cam in camaras"
                                :key="cam.id_camara"
                                :value="cam.id_camara"
                            >
                                {{ cam.nombre_camara }}
                            </option>
                        </select>
                    </label>

                    <label>
                        Comentarios
                        <input v-model="form.comentarios" type="text" maxlength="250" />
                    </label>

                    <label v-if="modoEdicion">
                        Estado
                        <select v-model.number="form.estado">
                            <option :value="1">Planeada</option>
                            <option :value="2">En recepción</option>
                            <option :value="3">Recibida</option>
                            <option :value="0">Cancelada</option>
                        </select>
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
                        {{ guardando ? "Guardando…" : "Guardar" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ===== MODAL CARGA EXCEL ===== -->
        <div v-if="modalExcel" class="modal-overlay" @click.self="cerrarExcel">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>📄 Carga masiva por Excel</h3>
                    <button class="modal-close" @click="cerrarExcel">✕</button>
                </div>

                <div class="modal-body">
                    <div class="excel-pasos">
                        <p>
                            <b>1.</b> Descarga la plantilla, llénala con los
                            <b>códigos</b> de tus catálogos y súbela.
                        </p>
                        <button class="btn-plantilla" @click="descargarPlantilla">
                            ⬇️ Descargar plantilla
                        </button>
                    </div>

                    <label class="excel-file">
                        <b>2.</b> Selecciona tu archivo Excel:
                        <input type="file" accept=".xlsx,.xls" @change="onArchivo" />
                    </label>

                    <div v-if="erroresPreview.length" class="excel-errores">
                        <b>⚠️ {{ erroresPreview.length }} fila(s) con problemas (no se importarán):</b>
                        <ul>
                            <li v-for="(e, i) in erroresPreview" :key="i">
                                Fila {{ e.fila }}: {{ e.mensaje }}
                            </li>
                        </ul>
                    </div>

                    <div v-if="filasPreview.length" class="excel-preview">
                        <b>✅ {{ filasPreview.length }} fila(s) listas para importar:</b>
                        <div class="excel-preview-list">
                            <div
                                v-for="f in filasPreview.slice(0, 50)"
                                :key="f._fila"
                                class="excel-preview-item"
                            >
                                Fila {{ f._fila }}: {{ f._resumen }}
                                · Sem {{ f.semana }} · {{ f.cajas_procesadas }} cajas
                            </div>
                            <div v-if="filasPreview.length > 50" class="excel-mas">
                                …y {{ filasPreview.length - 50 }} más
                            </div>
                        </div>
                    </div>

                    <div v-if="importando" class="excel-progreso">
                        Importando {{ progresoActual }} / {{ progresoTotal }}…
                        <div class="excel-bar">
                            <div
                                class="excel-bar-fill"
                                :style="{ width: (progresoTotal ? (progresoActual/progresoTotal*100) : 0) + '%' }"
                            ></div>
                        </div>
                    </div>

                    <div v-if="resultadoImport" class="excel-resultado">
                        <b>✅ {{ resultadoImport.ok }} producciones importadas.</b>
                        <div v-if="resultadoImport.errores.length" class="excel-errores">
                            <b>{{ resultadoImport.errores.length }} fila(s) fallaron:</b>
                            <ul>
                                <li v-for="(e, i) in resultadoImport.errores" :key="i">
                                    Fila {{ e.fila }}: {{ e.mensaje }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancelar" @click="cerrarExcel">Cerrar</button>
                    <button
                        class="btn-guardar"
                        :disabled="importando || filasPreview.length === 0 || resultadoImport"
                        @click="confirmarImport"
                    >
                        {{ importando ? "Importando…" : `Importar ${filasPreview.length} filas` }}
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
