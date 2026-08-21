// =========================================================
// MATRIZ DE PERMISOS (RBAC) — espejo EXACTO del backend
// =========================================================
// Guards inclusivos: Admin(1) ⊂ Coordinador(1,2) ⊂ Supervisor(1,2,3) ⊂ Operativo(1,2,3,4)
//
// GRUPO OPERATIVO  (ver/crear=operativo, editar=coordinador, eliminar=admin)
//   pulpeos, inventarios, transportes, lotes, bloques, mantenimientos, despachos
// GRUPO CATÁLOGO   (ver/crear=supervisor, editar=coordinador, eliminar=admin)
//   camaras, ocupaciones, sku, productores, fincas, cedis
// GRUPO ADMIN      (ver/crear/editar=coordinador, eliminar=admin)
//   usuarios (SIN delete), empleados
// =========================================================

export const ROLES = {
    ADMIN: 1,
    COORDINADOR: 2,
    SUPERVISOR: 3,
    OPERATIVO: 4
};

export const ROLE_LABEL = {
    1: "Administrador",
    2: "Coordinador",
    3: "Supervisor",
    4: "Operativo"
};

// Catálogo de módulos (clave, etiqueta, ruta, ícono, grupo visual, tipo de permiso)
// tipo: "operativo" | "catalogo" | "admin"
export const MODULES = [
    { key: "dashboard",      label: "Inicio",           path: "/dashboard",       icon: "🏠", group: "General",        tipo: "inicio" },

    // OPERATIVOS
    { key: "lotes",          label: "Lotes",            path: "/lotes",           icon: "🏷️", group: "Operación",      tipo: "operativo" },
    { key: "bloques",        label: "Bloques",          path: "/bloques",         icon: "🧱", group: "Operación",      tipo: "operativo" },
    { key: "pulpeos",        label: "Pulpeos",          path: "/pulpeos",         icon: "🌡️", group: "Operación",      tipo: "operativo" },
    { key: "inventarios",    label: "Inventarios",      path: "/inventarios",     icon: "🔄", group: "Operación",      tipo: "operativo" },
    { key: "mantenimientos", label: "Mantenimientos",   path: "/mantenimientos",  icon: "🛠️", group: "Operación",      tipo: "operativo" },
    { key: "transportes",    label: "Transportes",      path: "/transportes",     icon: "🚚", group: "Operación",      tipo: "operativo" },
    { key: "despachos",      label: "Despachos",        path: "/despachos",       icon: "📤", group: "Operación",      tipo: "operativo" },
    
    // CATÁLOGOS
    { key: "camaras",        label: "Cámaras",          path: "/camaras",         icon: "🧊", group: "Catálogos",      tipo: "catalogo" },
    { key: "ocupaciones",    label: "Ocupaciones",      path: "/ocupaciones",     icon: "📦", group: "Catálogos",      tipo: "catalogo" },
    { key: "sku",            label: "SKU",              path: "/sku",             icon: "🔖", group: "Catálogos",      tipo: "catalogo" },
    { key: "productores",    label: "Productores",      path: "/productores",     icon: "👨‍🌾", group: "Catálogos",      tipo: "catalogo" },
    { key: "fincas",         label: "Fincas",           path: "/fincas",          icon: "🌱", group: "Catálogos",      tipo: "catalogo" },
    { key: "cedis",          label: "Cedis / Clientes", path: "/cedis",           icon: "🏬", group: "Catálogos",      tipo: "catalogo" },
    { key: "produccion",     label: "Producción",       path: "/produccion",      icon: "🏭", group: "Operación",      tipo: "catalogo" },
    { key: "recepciones",    label: "Recepciones",      path: "/recepciones",     icon: "📥", group: "Operación",      tipo: "catalogo" },

    // ADMINISTRACIÓN
    { key: "empleados",      label: "Empleados",        path: "/empleados",       icon: "🧑‍💼", group: "Administración", tipo: "admin" },
    { key: "usuarios",       label: "Usuarios",         path: "/usuarios",        icon: "🔐", group: "Administración", tipo: "admin_sin_delete" }
];

// Conjuntos de acciones base
const NADA      = { view: false, create: false, edit: false, delete: false };

// Devuelve permisos {view,create,edit,delete} para un rol y un módulo según su tipo
function permisosPara(idRole, tipo) {
    const r = Number(idRole);
    switch (tipo) {
        case "inicio":
            // Inicio visible para todos los roles con sesión
            return { view: true, create: false, edit: false, delete: false };

        case "operativo":
            // ver/crear: operativo+ (1,2,3,4) | editar: coordinador+ (1,2) | eliminar: admin (1)
            return {
                view:   [1, 2, 3, 4].includes(r),
                create: [1, 2, 3, 4].includes(r),
                edit:   [1, 2].includes(r),
                delete: r === 1
            };

        case "catalogo":
            // ver/crear: supervisor+ (1,2,3) | editar: coordinador+ (1,2) | eliminar: admin (1)
            return {
                view:   [1, 2, 3].includes(r),
                create: [1, 2, 3].includes(r),
                edit:   [1, 2].includes(r),
                delete: r === 1
            };

        case "admin":
            // ver/crear/editar: coordinador+ (1,2) | eliminar: admin (1)
            return {
                view:   [1, 2].includes(r),
                create: [1, 2].includes(r),
                edit:   [1, 2].includes(r),
                delete: r === 1
            };

        case "admin_sin_delete":
            // usuarios: ver/crear/editar: coordinador+ (1,2) | eliminar: NO existe ruta
            return {
                view:   [1, 2].includes(r),
                create: [1, 2].includes(r),
                edit:   [1, 2].includes(r),
                delete: false
            };

        default:
            return { ...NADA };
    }
}

// Construye la matriz PERMISSIONS[idRole][moduleKey] = {view,create,edit,delete}
function construirMatriz() {
    const matriz = { 1: {}, 2: {}, 3: {}, 4: {} };
    for (const idRole of [1, 2, 3, 4]) {
        for (const mod of MODULES) {
            matriz[idRole][mod.key] = permisosPara(idRole, mod.tipo);
        }
    }
    return matriz;
}

export const PERMISSIONS = construirMatriz();

// ---- API de consulta ----
export function can(idRole, moduleKey, action) {
    const rolePerms = PERMISSIONS[Number(idRole)];
    if (!rolePerms) return false;
    const modPerms = rolePerms[moduleKey];
    if (!modPerms) return false;
    return !!modPerms[action];
}

export function canAccessModule(idRole, moduleKey) {
    return can(idRole, moduleKey, "view");
}

export function visibleModules(idRole) {
    return MODULES.filter((m) => canAccessModule(idRole, m.key));
}
