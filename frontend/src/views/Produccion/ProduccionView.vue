<script setup>
// El componente SOLO orquesta: lógica + template.
// Los estilos viven en ./produccion.css.
//
// Vista de PRODUCCIÓN (plan logístico) en formato TABLA con:
//  - Filtros: texto libre, por día, por semana, por mes, por estado.
//  - Alta uno por uno (modal con dropdowns de catálogos).
//  - Carga masiva por Excel POR IDs.
//  - AUTOCÁLCULO DE ESTIBA (tarimas): 48 cajas = 1 tarima
//    (42 para CPL08133/34/41).
//  - AUTOGENERACIÓN DEL CÓDIGO DE LOTE (15 díg.): editable.
//      Zona(finca) + Productor(2) + Finca(3) - Semana(2) + FechaDDMM - Turno(sku)
//      Ej: B12015-251806-1
//
// Requiere:  npm install xlsx --legacy-peer-deps
import { ref, reactive, computed, watch, onMounted } from "vue";
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

// ---------- Regla de estiba (cajas -> tarimas) ----------
const SKUS_FACTOR_42 = ["CPL08133", "CPL08134", "CPL08141"];
const factorCajasPorTarima = (codigo_sku) =>
    SKUS_FACTOR_42.includes(String(codigo_sku || "").trim().toUpperCase())
        ? 42
        : 48;
const calcularEstiba = (cajas, codigo_sku) => {
    const c = Number(cajas) || 0;
    if (c <= 0) return 0;
    return Math.ceil(c / factorCajasPorTarima(codigo_sku));
};

// ---------- Generador de LOTE (15 dígitos) ----------
const ZONA_LETRA = { 1: "A", 2: "B", 3: "C" };
const pad = (v, n) => String(v ?? "").padStart(n, "0").slice(-n);
const generarLote = ({
    zonaFinca,
    codigoProductor,
    codigoFinca,
    semana,
    fechaEmpaque,
    turno
}) => {
    if (!codigoProductor || !codigoFinca || !semana || !fechaEmpaque) return "";
    const z = ZONA_LETRA[Number(zonaFinca)] || "X";
    const prod = pad(codigoProductor, 2);
    const fin = pad(codigoFinca, 3);
    const sem = pad(semana, 2);
    const mm = String(fechaEmpaque).substring(5, 7);
    const dd = String(fechaEmpaque).substring(8, 10);
    const t = String(turno ?? 1).slice(-1);
    return `${z}${prod}${fin}-${sem}${dd}${mm}-${t}`;
};

// Estados de producción
const ESTADOS = { 0: "Cancelada", 1: "Planeada", 2: "En recepción", 3: "Recibida" };
const estadoLabel = (e) => ESTADOS[Number(e)] || "—";

// ---------- Estado ----------
const producciones = ref([]);
const cargando = ref(false);
const errorMsg = ref("");

const fincas = ref([]);
const productores = ref([]);
const skus = ref([]);
const cedis = ref([]);
const camaras = ref([]);

// ---------- Filtros ----------
const busqueda = ref("");
const filtroModo = ref("todos");
const filtroDia = ref("");
const filtroSemana = ref("");
const filtroMes = ref("");
const filtroEstado = ref("todos");

// ---------- Modal alta/edición ----------
const modalAbierto = ref(false);
const modoEdicion = ref(false);
const guardando = ref(false);
const errorForm = ref("");
const idEditando = ref(null);
const estibaManual = ref(false);
const loteManual = ref(false);

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
    codigo_lote: "",
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

// Objetos seleccionados en el modal
const fincaSel = computed(() =>
    fincas.value.find((f) => Number(f.id_finca) === Number(form.id_finca))
);
const productorSel = computed(() =>
    productores.value.find((p) => Number(p.id_productor) === Number(form.id_productor))
);
const skuSel = computed(() =>
    skus.value.find((s) => Number(s.id_sku) === Number(form.id_sku))
);
const codigoSkuSeleccionado = computed(() => skuSel.value?.codigo_sku || "");
const factorActual = computed(() =>
    factorCajasPorTarima(codigoSkuSeleccionado.value)
);

// Autocalcular estiba
watch(
    () => [form.cajas_procesadas, form.id_sku],
    () => {
        if (!estibaManual.value) {
            form.estiba_pallets = calcularEstiba(
                form.cajas_procesadas,
                codigoSkuSeleccionado.value
            );
        }
    }
);

// Autogenerar lote al cambiar finca/productor/semana/fecha/sku (turno del sku)
watch(
    () => [form.id_finca, form.id_productor, form.semana, form.fecha_empaque, form.id_sku],
    () => {
        if (!loteManual.value) {
            form.codigo_lote = generarLote({
                zonaFinca: fincaSel.value?.zona,
                codigoProductor: productorSel.value?.codigo_productor,
                codigoFinca: fincaSel.value?.codigo_finca,
                semana: form.semana,
                fechaEmpaque: form.fecha_empaque,
                turno: skuSel.value?.turno
            });
        }
    }
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

// Sets de IDs válidos
const idsFinca = computed(() => new Set(fincas.value.map((f) => Number(f.id_finca))));
const idsProductor = computed(() => new Set(productores.value.map((p) => Number(p.id_productor))));
const idsSku = computed(() => new Set(skus.value.map((s) => Number(s.id_sku))));
const idsCc = computed(() => new Set(cedis.value.map((c) => Number(c.id_cc))));
const idsCamara = computed(() => new Set(camaras.value.map((c) => Number(c.id_camara))));

// Índices por id para la carga Excel (para estiba y lote)
const skuPorId = computed(() => {
    const m = {};
    for (const s of skus.value) m[Number(s.id_sku)] = s;
    return m;
});
const fincaPorId = computed(() => {
    const m = {};
    for (const f of fincas.value) m[Number(f.id_finca)] = f;
    return m;
});
const productorPorId = computed(() => {
    const m = {};
    for (const p of productores.value) m[Number(p.id_productor)] = p;
    return m;
});

// ---------- Filtro combinado ----------
const produccionesFiltradas = computed(() => {
    let lista = producciones.value;
    if (filtroEstado.value !== "todos") {
        lista = lista.filter((p) => Number(p.estado) === Number(filtroEstado.value));
    }
    if (filtroModo.value === "dia" && filtroDia.value) {
        lista = lista.filter((p) => (p.fecha_empaque || "").substring(0, 10) === filtroDia.value);
    } else if (filtroModo.value === "semana" && filtroSemana.value) {
        lista = lista.filter((p) => Number(p.semana) === Number(filtroSemana.value));
    } else if (filtroModo.value === "mes" && filtroMes.value) {
        lista = lista.filter((p) => (p.fecha_empaque || "").substring(0, 7) === filtroMes.value);
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
                (p.codigo_lote || "").toLowerCase().includes(q) ||
                (p.nombre_camara || "").toLowerCase().includes(q)
            );
        });
    }
    return lista;
});

const totalCajas = computed(() =>
    produccionesFiltradas.value.reduce((s, p) => s + (Number(p.cajas_procesadas) || 0), 0)
);
const totalTarimas = computed(() =>
    produccionesFiltradas.value.reduce((s, p) => s + (Number(p.estiba_pallets) || 0), 0)
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
    estibaManual.value = false;
    loteManual.value = false;
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
        codigo_lote: "",
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
    estibaManual.value = true;
    loteManual.value = true; // al editar respetamos el lote guardado
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
        codigo_lote: p.codigo_lote ?? "",
        comentarios: p.comentarios ?? "",
        id_camara: p.id_camara ?? "",
        estado: p.estado ?? 1
    });
    modalAbierto.value = true;
};

const cerrarModal = () => {
    modalAbierto.value = false;
};

const recalcularEstiba = () => {
    estibaManual.value = false;
    form.estiba_pallets = calcularEstiba(
        form.cajas_procesadas,
        codigoSkuSeleccionado.value
    );
};

const regenerarLote = () => {
    loteManual.value = false;
    form.codigo_lote = generarLote({
        zonaFinca: fincaSel.value?.zona,
        codigoProductor: productorSel.value?.codigo_productor,
        codigoFinca: fincaSel.value?.codigo_finca,
        semana: form.semana,
        fechaEmpaque: form.fecha_empaque,
        turno: skuSel.value?.turno
    });
};

const construirPayload = () => ({
    semana: Number(form.semana),
    region: form.region?.trim() || null,
    id_finca: Number(form.id_finca),
    id_productor: Number(form.id_productor),
    fecha_empaque: form.fecha_empaque,
    transito: form.transito === "" || form.transito === null ? null : Number(form.transito),
    fecha_entrega: form.fecha_entrega || null,
    id_cc: Number(form.id_cc),
    id_sku: Number(form.id_sku),
    cajas_procesadas: Number(form.cajas_procesadas) || 0,
    estiba_pallets: Number(form.estiba_pallets) || 0,
    codigo_lote: form.codigo_lote?.trim() || null,
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
            await produccionService.actualizarProduccion(idEditando.value, payload);
        } else {
            await produccionService.crearProduccion(payload);
        }
        cerrarModal();
        await cargarProducciones();
    } catch (error) {
        errorForm.value =
            error?.response?.data?.error || "No se pudo guardar la producción.";
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
            error?.response?.data?.error || "No se pudo eliminar la producción.";
    }
};

// =========================================================
// CARGA MASIVA POR EXCEL (POR IDs)
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

const descargarPlantilla = () => {
    const encabezados = [
        "semana", "region", "id_finca", "id_productor", "fecha_empaque",
        "transito", "fecha_entrega", "id_cc", "id_sku",
        "cajas_procesadas", "estiba_pallets", "codigo_lote", "comentarios", "id_camara"
    ];
    const ejemplo = [
        34, "Chiapas", 52, 113, "2026-08-20", 4, "2026-08-24",
        16, 13, 1152, 24, "", "24 convencional", 3
    ];
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ejemplo]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produccion");
    XLSX.writeFile(wb, "plantilla_produccion_ids.xlsx");
};

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

const numOrNull = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
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
            const idFinca = numOrNull(row.id_finca);
            const idProductor = numOrNull(row.id_productor);
            const idSku = numOrNull(row.id_sku);
            const idCc = numOrNull(row.id_cc);
            const idCamara = numOrNull(row.id_camara);

            const problemas = [];
            if (!row.semana || isNaN(Number(row.semana))) problemas.push("semana inválida");
            if (!row.fecha_empaque) problemas.push("falta fecha_empaque");
            if (idFinca === null || !idsFinca.value.has(idFinca))
                problemas.push(`id_finca '${row.id_finca}' no existe`);
            if (idProductor === null || !idsProductor.value.has(idProductor))
                problemas.push(`id_productor '${row.id_productor}' no existe`);
            if (idSku === null || !idsSku.value.has(idSku))
                problemas.push(`id_sku '${row.id_sku}' no existe`);
            if (idCc === null || !idsCc.value.has(idCc))
                problemas.push(`id_cc '${row.id_cc}' no existe`);
            if (idCamara !== null && !idsCamara.value.has(idCamara))
                problemas.push(`id_camara '${row.id_camara}' no existe`);

            if (problemas.length > 0) {
                errores.push({ fila: numFila, mensaje: problemas.join("; ") });
                return;
            }

            const cajas = Number(row.cajas_procesadas) || 0;
            const sku = skuPorId.value[idSku];
            const finca = fincaPorId.value[idFinca];
            const productor = productorPorId.value[idProductor];
            const fechaEmpaque = normalizarFecha(row.fecha_empaque);

            // Estiba: respeta la del Excel si trae, si no calcula
            const estibaExcel = numOrNull(row.estiba_pallets);
            const estiba =
                estibaExcel !== null && estibaExcel > 0
                    ? estibaExcel
                    : calcularEstiba(cajas, sku?.codigo_sku);

            // Lote: respeta el del Excel si trae, si no genera
            const loteExcel = String(row.codigo_lote || "").trim();
            const lote =
                loteExcel !== ""
                    ? loteExcel
                    : generarLote({
                          zonaFinca: finca?.zona,
                          codigoProductor: productor?.codigo_productor,
                          codigoFinca: finca?.codigo_finca,
                          semana: Number(row.semana),
                          fechaEmpaque,
                          turno: sku?.turno
                      });

            validas.push({
                _fila: numFila,
                _resumen: `Finca ${idFinca} · SKU ${idSku} · CC ${idCc}`,
                _lote: lote,
                semana: Number(row.semana),
                region: String(row.region || "").trim() || null,
                id_finca: idFinca,
                id_productor: idProductor,
                fecha_empaque: fechaEmpaque,
                transito: numOrNull(row.transito),
                fecha_entrega: row.fecha_entrega ? normalizarFecha(row.fecha_entrega) : null,
                id_cc: idCc,
                id_sku: idSku,
                cajas_procesadas: cajas,
                estiba_pallets: estiba,
                codigo_lote: lote || null,
                comentarios: String(row.comentarios || "").trim() || null,
                id_camara: idCamara,
                estado: 1
            });
        });

        filasPreview.value = validas;
        erroresPreview.value = errores;
    } catch (error) {
        erroresPreview.value = [{ fila: "-", mensaje: "No se pudo leer el archivo Excel." }];
    } finally {
        event.target.value = "";
    }
};

const confirmarImport = async () => {
    if (filasPreview.value.length === 0) return;
    importando.value = true;
    progresoActual.value = 0;
    progresoTotal.value = filasPreview.value.length;
    const payload = filasPreview.value.map(
        ({ _fila, _resumen, _lote, ...rest }) => rest
    );
    try {
        const res = await produccionService.crearMasivo(payload, (actual) => {
            progresoActual.value = actual;
        });
        resultadoImport.value = res;
        await cargarProducciones();
    } catch (error) {
        erroresPreview.value.push({ fila: "-", mensaje: "Error general durante la importación." });
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
                <button v-if="canCreate" class="prod-btn-excel" @click="abrirExcel">
                    📄 Cargar Excel
                </button>
                <button v-if="canCreate" class="prod-btn-nueva" @click="abrirCrear">
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
                placeholder="🔍 Buscar por finca, productor, SKU, cliente, lote…"
            />
            <select v-model="filtroModo" class="prod-select">
                <option value="todos">Todas las fechas</option>
                <option value="dia">Por día</option>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
            </select>
            <input v-if="filtroModo === 'dia'" v-model="filtroDia" type="date" class="prod-select" />
            <input v-if="filtroModo === 'semana'" v-model="filtroSemana" type="number" min="1" max="53" placeholder="Semana" class="prod-select" />
            <input v-if="filtroModo === 'mes'" v-model="filtroMes" type="month" class="prod-select" />
            <select v-model="filtroEstado" class="prod-select">
                <option value="todos">Todos los estados</option>
                <option value="1">Planeada</option>
                <option value="2">En recepción</option>
                <option value="3">Recibida</option>
                <option value="0">Cancelada</option>
            </select>
            <button class="prod-btn-limpiar" @click="limpiarFiltros">Limpiar</button>
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
        <div v-else-if="produccionesFiltradas.length === 0" class="prod-estado">
            No se encontraron producciones con los filtros aplicados.
        </div>

        <!-- Tabla -->
        <div v-else class="prod-tabla-wrap">
            <table class="prod-tabla">
                <thead>
                    <tr>
                        <th class="col-centro">Sem</th>
                        <th>Lote</th>
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
                        <td>
                            <span class="lote-pill">{{ p.codigo_lote || "—" }}</span>
                        </td>
                        <td>
                            <span class="cod-pill">{{ p.codigo_finca }}</span>
                            {{ p.nombre_finca }}
                        </td>
                        <td>{{ p.nombre_productor }}</td>
                        <td class="col-centro">{{ (p.fecha_empaque || "").substring(0, 10) }}</td>
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
                            <span v-if="p.nombre_camara" class="pill-pre">🧊 {{ p.nombre_camara }}</span>
                            <span v-else class="pill-directo">Directo</span>
                        </td>
                        <td class="col-centro">
                            <span class="badge-estado" :class="'est-' + Number(p.estado)">
                                {{ estadoLabel(p.estado) }}
                            </span>
                        </td>
                        <td v-if="hayAcciones" class="col-centro">
                            <div class="acciones">
                                <button v-if="canEdit" class="btn-icono editar" title="Editar" @click="abrirEditar(p)">✏️</button>
                                <button v-if="canDelete" class="btn-icono eliminar" title="Eliminar" @click="eliminar(p)">🗑️</button>
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
                            <option v-for="f in fincas" :key="f.id_finca" :value="f.id_finca">
                                {{ f.codigo_finca }} · {{ f.nombre }}
                            </option>
                        </select>
                    </label>

                    <label>
                        Productor *
                        <select v-model="form.id_productor">
                            <option value="" disabled>Selecciona un productor…</option>
                            <option v-for="pr in productores" :key="pr.id_productor" :value="pr.id_productor">
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
                            <option v-for="c in cedis" :key="c.id_cc" :value="c.id_cc">
                                {{ c.acronimo }} · {{ c.cliente }} ({{ c.cedis }})
                            </option>
                        </select>
                    </label>

                    <label>
                        SKU *
                        <select v-model="form.id_sku">
                            <option value="" disabled>Selecciona un SKU…</option>
                            <option v-for="s in skus" :key="s.id_sku" :value="s.id_sku">
                                {{ s.codigo_sku }} · {{ s.calidad }} (turno {{ s.turno }})
                            </option>
                        </select>
                    </label>

                    <!-- LOTE autogenerado -->
                    <label>
                        Código de lote (15 díg.)
                        <span class="lote-hint">se genera solo; editable si cambia</span>
                        <div class="estiba-row">
                            <input
                                v-model="form.codigo_lote"
                                type="text"
                                maxlength="20"
                                placeholder="Ej. B12015-251806-1"
                                @input="loteManual = true"
                            />
                            <button
                                type="button"
                                class="btn-recalc"
                                title="Regenerar lote"
                                @click="regenerarLote"
                            >
                                🔄 Auto
                            </button>
                        </div>
                    </label>

                    <div class="grid-2">
                        <label>
                            Tránsito (días)
                            <input v-model="form.transito" type="number" min="0" />
                        </label>
                        <label>
                            Cajas procesadas
                            <input v-model="form.cajas_procesadas" type="number" min="0" />
                        </label>
                    </div>

                    <!-- ESTIBA autocalculada -->
                    <label>
                        Estiba (tarimas)
                        <span class="estiba-hint" v-if="form.id_sku">
                            regla: {{ factorActual }} cajas = 1 tarima
                        </span>
                        <div class="estiba-row">
                            <input
                                v-model="form.estiba_pallets"
                                type="number"
                                min="0"
                                @input="estibaManual = true"
                            />
                            <button
                                type="button"
                                class="btn-recalc"
                                title="Recalcular con la regla"
                                @click="recalcularEstiba"
                            >
                                🔄 Auto
                            </button>
                        </div>
                    </label>

                    <label>
                        Preenfrío (cámara) — planeación inicial
                        <select v-model="form.id_camara">
                            <option value="">Directo (no se preenfría)</option>
                            <option v-for="cam in camaras" :key="cam.id_camara" :value="cam.id_camara">
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
                    <button class="btn-guardar" :disabled="guardando || !formValido" @click="guardar">
                        {{ guardando ? "Guardando…" : "Guardar" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ===== MODAL CARGA EXCEL ===== -->
        <div v-if="modalExcel" class="modal-overlay" @click.self="cerrarExcel">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>📄 Carga masiva por Excel (por IDs)</h3>
                    <button class="modal-close" @click="cerrarExcel">✕</button>
                </div>

                <div class="modal-body">
                    <div class="excel-pasos">
                        <p>
                            <b>1.</b> Descarga la plantilla, llénala con los
                            <b>IDs</b> de tus catálogos y súbela. Deja
                            <b>estiba_pallets</b> y <b>codigo_lote</b> vacíos para
                            que se calculen/generen solos. Deja <b>id_camara</b>
                            vacío si va directo.
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
                                · Lote {{ f._lote || "—" }}
                                · {{ f.cajas_procesadas }} cajas / {{ f.estiba_pallets }} tar
                            </div>
                            <div v-if="filasPreview.length > 50" class="excel-mas">
                                …y {{ filasPreview.length - 50 }} más
                            </div>
                        </div>
                    </div>

                    <div v-if="importando" class="excel-progreso">
                        Importando {{ progresoActual }} / {{ progresoTotal }}…
                        <div class="excel-bar">
                            <div class="excel-bar-fill" :style="{ width: (progresoTotal ? (progresoActual/progresoTotal*100) : 0) + '%' }"></div>
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
