import { chickenService } from '../js/chickens.service.js';

// VARIABLES GLOBALES

let modalInstance = null;
let createModalInstance = null;

let cacheGalpones = null;
let cacheTipos = null;

let allChickens = [];
let filteredChickens = [];

// FUNCION DE CREACIÓN DE FILAS

function createChickenRow(chicken) {
    const chickenId = chicken.id_ingreso;

    const idRol = JSON.parse(localStorage.getItem('user'))?.id_rol;
    const fechaFormateada = chicken.fecha.split('-').reverse().join('/');

    const tabla = `
        <tr>
            <td class="px-0">${chicken.nombre_galpon}</td>
            <td class="px-0">${fechaFormateada}</td>
            <td class="px-0">${chicken.raza}</td>
            <td class="px-0">${chicken.cantidad_gallinas} gallinas</td>
            <td class="text-end">
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-success btn-edit-chicken" aria-label="Editar" title="Editar" data-chicken-id="${chickenId}">
                        <i class="fa fa-pen me-0"></i>
                    </button>
                    ${idRol === 1 || idRol === 2 ? `
                        <button class="btn btn-sm btn-secondary btn-delete-chicken" aria-label="Eliminar" title="Eliminar" data-chicken-id="${chickenId}">
                            <i class="fa fa-trash me-0"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;

    return tabla;
}

// FUNCIONES DE CARGA DE SELECTS

async function cargarSelectGalpones() {
    const selectCreate = document.getElementById('create-id_galpon');
    const selectEdit = document.getElementById('edit-id_galpon');

    try {
        if (!cacheGalpones) {
            cacheGalpones = await chickenService.getGalpones();
        }

        const options = cacheGalpones.map(g => `
            <option value="${g.id_galpon}">
                ${g.nombre}
            </option>
        `).join('');

        if (selectCreate) {
            selectCreate.innerHTML = `<option value="" disabled selected>Seleccione un galpón</option>${options}`;
        }

        if (selectEdit) {
            selectEdit.innerHTML = `<option value="" disabled>Seleccione un galpón</option>${options}`;
        }

    } catch (error) {
        console.error("Error cargando galpones:", error);
        if (selectCreate) {
            selectCreate.innerHTML = `<option>Error al cargar</option>`;
        }
        if (selectEdit) {
            selectEdit.innerHTML = `<option>Error al cargar</option>`;
        }
    }
}

async function cargarSelectTypeChickens() {
    const selectCreate = document.getElementById('create-id_tipo_gallina');
    const selectEdit = document.getElementById('edit-id_tipo_gallina');

    try {
        if (!cacheTipos) {
            cacheTipos = await chickenService.getTypeChickens();
        }

        const options = cacheTipos.map(t => `
            <option value="${t.id_tipo_gallinas}">
                ${t.raza}
            </option>
        `).join('');

        if (selectCreate) {
            selectCreate.innerHTML = `<option value="" disabled selected>Seleccione un tipo</option>${options}`;
        }

        if (selectEdit) {
            selectEdit.innerHTML = `<option value="" disabled>Seleccione un tipo</option>${options}`;
        }

    } catch (error) {
        console.error("Error cargando los tipos de gallinas:", error);
        if (selectCreate) {
            selectCreate.innerHTML = `<option>Error al cargar</option>`;
        }
        if (selectEdit) {
            selectEdit.innerHTML = `<option>Error al cargar</option>`;
        }
    }
}

async function cargarSelectFilterGalpones() {
    const selectFilter = document.getElementById('filter-galpon');

    try {
        if (!cacheGalpones) {
            cacheGalpones = await chickenService.getGalpones();
        }

        const options = cacheGalpones.map(g => `
            <option value="${g.id_galpon}">
                ${g.nombre}
            </option>
        `).join('');

        if (selectFilter) {
            selectFilter.innerHTML = `<option value="" selected>Todos</option>${options}`;
        }

    } catch (error) {
        if (selectFilter) {
            selectFilter.innerHTML = `<option>Error al cargar por filtros</option>`;
        }
    }
}


// FUNCIONES DE MODAL

async function openEditModal(chickenId) {
    const modalElement = document.getElementById('editChickenModal');
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalElement);
    }

    try {
        const chicken = await chickenService.getChickenById(chickenId);
        
        await cargarSelectGalpones();
        await cargarSelectTypeChickens();
        
        document.getElementById('edit-chicken-id').value = chicken.id_ingreso;
        document.getElementById('edit-id_galpon').value = chicken.id_galpon;
        document.getElementById('edit-id_tipo_gallina').value = chicken.id_tipo_gallina;
        document.getElementById('edit-cantidad_gallinas').value = chicken.cantidad_gallinas;
        
        modalInstance.show();
    } catch (error) {
        console.error(`Error al obtener los registros de gallinas ${chickenId}:`, error);
        Swal.fire({
                    icon: "error",
                    text: "No se pudieron cargar los datos de los registros.",
                });
    }
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
    event.preventDefault();
    const chickenId = document.getElementById('edit-chicken-id').value;
    const updatedData = {
        id_galpon: parseInt(document.getElementById('edit-id_galpon').value),
        id_tipo_gallina: parseInt(document.getElementById('edit-id_tipo_gallina').value),
        cantidad_gallinas: parseInt(document.getElementById('edit-cantidad_gallinas').value),
    };

    try {
        await chickenService.updateChicken(chickenId, updatedData);
        modalInstance.hide();
        init();
        Swal.fire({
            icon: "success",
            title: "Actualizado",
            text: "Registro actualizado exitosamente.",
        });
    } catch (error) {
        console.error(`Error al actualizar el registro ${chickenId}:`, error);

        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el registro..",
        });
    }
}

async function handleTableClick(event) {
    const editButton = event.target.closest('.btn-edit-chicken');
    if (editButton) {
        const chickenId = editButton.dataset.chickenId;
        openEditModal(chickenId);
        return;
    }

    const deleteButton = event.target.closest('.btn-delete-chicken');
    if (deleteButton) {
        const chickenId = deleteButton.dataset.chickenId;
        await handleDeleteChicken(chickenId);
        return;
    }
}

async function handleDeleteChicken(chickenId) {
    try {
        const result = await Swal.fire({
            title: "¿Eliminar registro?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        await chickenService.deleteChicken(chickenId);

        await Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "Registro eliminado exitosamente.",
        });

        init();

    } catch (error) {
        console.error(`Error al eliminar el registro ${chickenId}:`, error);

        Swal.fire({
            icon: "error",
            title: "Error",
            text: error?.message || "No se pudo eliminar el registro.",
        });
    }
}


async function handleCreateSubmit(event) {
    event.preventDefault();

    const fechaLocal = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())}`;

    const newChickenData = {
        id_galpon: parseInt(document.getElementById('create-id_galpon').value),
        fecha: fechaPC,
        id_tipo_gallina: parseInt(document.getElementById('create-id_tipo_gallina').value),
        cantidad_gallinas: parseInt(document.getElementById('create-cantidad_gallinas').value),
    };

    try {
        await chickenService.createChicken(newChickenData);
        
        const createModal = bootstrap.Modal.getInstance(document.getElementById('createChickenModal'));
        if (createModal) {
            createModal.hide();
        }
        
        document.getElementById('create-chicken-form').reset();
        await Swal.fire({
            icon: "success",
            title: "Creado",
            text: "Registro creado exitosamente.",
        });
        init(); 
    } catch (error) {
        console.error('Error al crear el registro:', error);
        
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo crear el registro.",
        });
    }
}

// PAGINACIÓN

function renderPagination(total_pages, currentPage = 1) {
    const container = document.querySelector("#paginacion");
    if (!container) return;

    container.innerHTML = "";
    const anterior = document.createElement("button");
    anterior.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
    anterior.textContent="<";
    anterior.addEventListener("click", () => {
      const prevPage = currentPage === 1 ? total_pages : currentPage - 1;
      init(prevPage, document.getElementById("pageSize").value);
    })
    container.appendChild(anterior);

    for (let i = 1; i <= total_pages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.disabled = i === currentPage;
        btn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
        btn.addEventListener("click", () => init(i, document.getElementById("pageSize").value));
        container.appendChild(btn);
    }
    const next = document.createElement("button");
    next.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
    next.textContent=">";
    next.addEventListener("click", () => {
      const nextPage = currentPage === total_pages ? 1 : currentPage + 1;
        init(nextPage, document.getElementById("pageSize").value);
    })
    container.appendChild(next);
}

// FILTROS

async function filtrarChickens(page = 1, pageSize = 10) {
    
    const galponId = document.getElementById('filter-galpon').value;
    let startDate = document.getElementById('filter-start-date').value;
    let endDate = document.getElementById('filter-end-date').value;

    const tableBody = document.getElementById('chicken-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando registros...</td></tr>';

    // Fechas por defecto
    if (!endDate) {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }
    if (!startDate) startDate = '2000-01-01';

    try {
        let data;

        if (galponId && !startDate && !endDate) {
            data = await chickenService.getChickensByGalpon(galponId, page, pageSize);
        } else if (!galponId && startDate && endDate) {
            data = await chickenService.getChickensByRangeDate(startDate, endDate, page, pageSize);
        } else if (galponId && startDate && endDate) {
            const galponData = await chickenService.getChickensByGalpon(galponId, page, pageSize);
            const filtered = galponData.record_chickens.filter(c => c.fecha >= startDate && c.fecha <= endDate);
            data = { record_chickens: filtered, total_pages: 1 };
        } else {
            data = await chickenService.getChickens(page, pageSize);
        }

        const chickens = data.record_chickens || [];


        filteredChickens = chickens;

        tableBody.innerHTML = chickens.length > 0 ? chickens.map(createChickenRow).join('') :
            '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>';
        renderPagination(data.total_pages || 1, 1);

    } catch (error) {
        console.error('Error al filtrar registros:', error);

        const msg = error?.message?.toLowerCase() || "";

        const noDataErrors = [
            "registro no encontrado",
            "no hay registros",
            "no hay registros en ese rango de fechas"
        ];

        if (noDataErrors.some(e => msg.includes(e))) {
            tableBody.innerHTML =
                '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>';
            return;
        }

        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos.</td></tr>';
    }
};

function limpiarFiltros() {
    document.getElementById("filter-galpon").value = "";
    document.getElementById("filter-start-date").value = "";
    document.getElementById("filter-end-date").value = "";

    filteredChickens = [];

    init(1, document.getElementById("pageSize").value);
}

// EXPORTACIÓN

function handleExportClick(event) {
    const item = event.target.closest(".export-format");
    if (!item) return;
    event.preventDefault();

    const fmt = item.dataset.format;
    const dateTag = new Date().toISOString().slice(0, 10);
    const data = filteredChickens && filteredChickens.length ? filteredChickens : allChickens;

    if (!data || data.length === 0) {
        Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
        return;
    }

    if (fmt === "csv") {
        exportToCSV(data, `Gallinas_${dateTag}.csv`);
    } else if (fmt === "excel") {
        exportToExcel(data, `Gallinas_${dateTag}.xls`);
    } else if (fmt === "pdf") {
        exportToPDF(data, `Gallinas_${dateTag}.pdf`);
    }
}

function convertToCSV(rows, columns) {
    const escapeCell = (val) => {
        if (val === null || val === undefined) return "";
        const s = String(val);

        return `${s.replace(/"/g, '""')}`;
    };

    const header = columns.map((c) => escapeCell(c.header)).join(",");
    const body = rows
        .map((row) =>
        columns
            .map((c) => {
            const v = typeof c.key === "function" ? c.key(row) : row[c.key];
            return escapeCell(v);
            })
            .join(",")
        )
        .join("\n");
    return `${header}\n${body}`;
}

function downloadBlob(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportToCSV(data, filename = "Gallinas.csv") {
    const columns = [
        { header: "ID", key: "id_ingreso" },
        { header: "Galpon", key: "nombre_galpon" },
        { header: "Fecha", key: "fecha" },
        { header: "Tipo_allina", key: "raza" },
        { header: "Cantidad_gallinas", key: "cantidad_gallinas" },
    ];
    const csv = convertToCSV(data, columns);
    downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "Gallinas.xlsx") {
    // Intentar usar SheetJS (XLSX) para crear un .xlsx real en el navegador.
    // Si no está cargado, lo cargamos dinámicamente desde CDN.
    const loadSheetJS = () =>
        new Promise((resolve, reject) => {
            if (window.XLSX) return resolve(window.XLSX);
            const script = document.createElement("script");
            script.src =
                "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
            script.onload = () => resolve(window.XLSX);
            script.onerror = (e) => reject(new Error("No se pudo cargar SheetJS"));
            document.head.appendChild(script);
        });

    try {
        await loadSheetJS();
    } catch (err) {
        console.warn(
        "SheetJS no disponible, se usará exportación CSV en su lugar",
        err
        );
        // Fallback al CSV con extensión xlsx si falla la carga
        exportToCSV(data, filename.replace(/\.xlsx?$/, ".csv"));
        return;
    }

    // Mapear datos a objetos planos para json_to_sheet
    const rows = data.map((r) => ({
        ID: r.id_ingreso,
        Galpon: r.nombre_galpon,
        Fecha: r.fecha,
        Tipo_gallina: r.raza,
        Cantidad_gallinas: r.cantidad_gallinas,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "chickens");

    try {
        XLSX.writeFile(wb, filename);
    } catch (e) {
        // Algunos navegadores / entornos pueden requerir otra ruta: crear blob desde write
        try {
            const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([wbout], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("No se pudo generar el archivo .xlsx:", err);
            Swal.fire({
                title: "Error al generar .xlsx",
                text: err.message || String(err),
                icon: "error",
            });
        }
    }
}

async function exportToPDF(data, filename = "Gallinas.pdf") {
    const sanitizedData = data.map(row => ({
        id_ingreso: row.id_ingreso || '',
        nombre_galpon: row.nombre_galpon || '',
        fecha: row.fecha || '',
        raza: row.raza || '',
        cantidad_gallinas: row.cantidad_gallinas || '',
    }));

    if (!window.jspdf) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }
    // Cargar autoTable desde jsDelivr
    if (!window.jspdfAutoTable) {
        await loadScript("https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Verificar que autoTable exista
    if (typeof doc.autoTable !== "function") {
        console.error("autoTable no se cargó correctamente");
        return;
    }

    doc.setFontSize(16);
    doc.text("Reporte de Gallinas", 14, 15);

    const columns = [
        { header: "ID", dataKey: "id_ingreso" },
        { header: "Galpon", dataKey: "nombre_galpon" },
        { header: "Fecha", dataKey: "fecha" },
        { header: "Tipo Gallina", dataKey: "raza" },
        { header: "Cantidad Gallinas", dataKey: "cantidad_gallinas" },
    ];

    doc.autoTable({ columns, body: sanitizedData, startY: 25, styles: { fontSize: 9 } });
    doc.save(filename);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(`Error cargando script: ${src}`);
        document.body.appendChild(script);
    });
}

// ASIGANCIÓN DE EVENTOS

document.getElementById('btn-filter').addEventListener('click', () => filtrarChickens(1, document.getElementById("pageSize").value));

const btnOpenCreateModal = document.querySelector('[data-bs-target="#createChickenModal"]');

if (btnOpenCreateModal) {
    btnOpenCreateModal.addEventListener('click', async () => {
        await cargarSelectGalpones();
        await cargarSelectTypeChickens();
    });
}

const selectPage = document.getElementById("pageSize");
selectPage.addEventListener("change", () => init(1, selectPage.value));

document.addEventListener("click", function(event) {
    const exportBtn = event.target.closest(".export-format");
    if (!exportBtn) return;
    event.preventDefault();
    handleExportClick(event);
});

const btnClear = document.getElementById('btn_clear_filters');
btnClear.addEventListener('click', limpiarFiltros);

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

async function init(page = 1, page_size = 10) {

    await cargarSelectFilterGalpones();

    const tableBody = document.getElementById('chicken-table-body');
    if (!tableBody) {
        console.error('No se encontró el elemento con id "chicken-table-body"');
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando registros de gallinas...</td></tr>'; 

    try {
        const data = await chickenService.getChickens(page, page_size);
        console.log('Registos obtenidos:', data);
        
        const chickens = data.record_chickens || [];

        allChickens = chickens;
        filteredChickens = [...chickens];

        if (chickens && chickens.length > 0) {
            tableBody.innerHTML = chickens.map(createChickenRow).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron registros.</td></tr>'; 
        }

        renderPagination(data.total_pages || 1, page);
    } catch (error) {
        console.error('Error al obtener los registros:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos.</td></tr>'; 
    }

    const editForm = document.getElementById('edit-chicken-form');
    const createForm = document.getElementById('create-chicken-form');
    
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    
    if (editForm) {
        editForm.removeEventListener('submit', handleUpdateSubmit);
        editForm.addEventListener('submit', handleUpdateSubmit);
    }
    
    if (createForm) {
        createForm.removeEventListener('submit', handleCreateSubmit);
        createForm.addEventListener('submit', handleCreateSubmit);
    }

}

init(1, selectPage.value);

export { init };
