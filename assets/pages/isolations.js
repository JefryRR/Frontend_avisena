import { isolationService } from '../js/isolations.service.js';

let modalInstance = null;
let createModalInstance = null;
let activeFechaInicio = "";
let activeFechaFin = "";

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
function createIsolationRow(isolation) {
  const isolationId = isolation.id_aislamiento;

  const fecha = new Date(isolation.fecha_hora);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true
  });
  return `
    <tr>
      <td class="px-0">
        <div class="d-flex align-items-center">
          <img src="./assets/images/profiles/isolation.jpg" class="rounded-circle" width="40" alt="flexy" />
          <div class="ms-3">
            <h6 class="mb-0 fw-bolder">${isolation.id_incidente_gallina}</h6>
          </div>
        </div>
      </td>
      <td class="px-0">${fechaFormateada}</td>
      <td class="px-0">${isolation.nombre}</td>
      <td class="px-0 text-end">
          <button class="btn btn-sm btn-success btn-edit-isolation" data-isolation-id="${isolationId}"><i class="fa-regular fa-pen-to-square"></i></button>
      </td>
    </tr>
  `;
}

function formatDateForAPI(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


async function fetchIsolations(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
  const token = localStorage.getItem('access_token');
  let url;

  if (fechaInicio && fechaFin) {
    // USAR EL MISMO FORMATO QUE EN EL CURL: YYYY-MM-DD sin tiempo
    url = `https://proyecto-sena-oatr.onrender.com/isolations/rango-fechas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&page=${page}&page_size=${page_size}`;
  } else {
    url = `https://proyecto-sena-oatr.onrender.com/isolations/all_isolations-pag?page=${page}&limit=${page_size}`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401) throw new Error("No autorizado.");

    if (res.status === 404) {
      return {
        isolation: [],
        total_isolation: 0,
        total_pages: 0,
        page: page,
        page_size: page_size
      };
    }

    if (!res.ok) throw new Error(`Error al cargar aislamientos: ${res.status}`);

    const json = await res.json();
    return json;
  } catch (error) {
    throw error;
  }
}

// ... (el resto de las funciones se mantienen igual hasta la función filtrarAislamientos)

function filtrarAislamientos(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    alert("Por favor selecciona ambas fechas.");
    return;
  }

  // Guardar fechas para usar en fetchIsolations
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  // Recargar la tabla desde la página 1 con el filtro
  init(1, 10);
}

// Botón para abrir modal
document.getElementById("btn_open_date_filter").addEventListener("click", () => {
  filterModal.show();
});

// Botón para aplicar filtro
document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  filtrarAislamientos(fechaInicio, fechaFin);

  // Cerrar modal
  filterModal.hide();
});

async function loadGalponesSelectCreate() {
  const select = document.getElementById('create_id_galpon');

  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch('https://proyecto-sena-oatr.onrender.com/sheds/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error al obtener galpones');

    const galpones = await res.json();

    // Limpia y llena las opciones
    select.innerHTML = '<option value="">Selecciona un galpón</option>';
    galpones.forEach(g => {
      const option = document.createElement('option');
      option.value = g.id_galpon;
      option.textContent = g.nombre;
      select.appendChild(option);
    });

    // Activa el buscador (solo si usas Select2)
    if (window.$ && $(select).select2) {
      $(document).ready(function() {
        $('#create_id_galpon').select2({
          dropdownParent: $('#exampleModal'),
          width: '100%',
          placeholder: 'Selecciona un galpón',
          allowClear: true, // agrega un botón de limpiar
          dropdownCssClass: 'select2-scroll',
          matcher: function(params, data) {
            if ($.trim(params.term) === '') return data;

            const term = params.term.toLowerCase();
            const text = (data.text || '').toLowerCase();
            const id = (data.id || '').toLowerCase();

            // Buscar coincidencia parcial en texto o en ID
            if (text.indexOf(term) > -1 || id.indexOf(term) > -1) {
              return data;
            }
            return null;
          }
        });
      });
    }

  } catch (error) {
    select.innerHTML = '<option value="">Error al cargar galpones</option>';
  }
}

async function loadGalponesSelectEdit(selectedId) {
  const select = document.getElementById('edit_id_galpon');
  select.innerHTML = '<option value="">Cargando galpones...</option>';

  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch('https://proyecto-sena-oatr.onrender.com/sheds/all', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Error al cargar galpones');

    const galpones = await res.json();
    select.innerHTML = '<option value="">Selecciona un galpón</option>';

    galpones.forEach(g => {
      const option = document.createElement('option');
      option.value = g.id_galpon;
      option.textContent = g.nombre;
      if (g.id_galpon === selectedId) option.selected = true;
      select.appendChild(option);
    });

  } catch (error) {
    select.innerHTML = '<option value="">Error al cargar galpones</option>';
  }
}

async function openEditModal(id_aislamiento) {
  const modalElement = document.getElementById('edit-isolation-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const isolation = await isolationService.getIsolationById(id_aislamiento);

    document.getElementById('edit-isolation-id').value = isolation.id_aislamiento;
    document.getElementById('edit-idIncidentGallina').value = isolation.id_incidente_gallina;
    
    await loadGalponesSelectEdit(isolation.id_galpon);
    
    modalInstance.show();
  } catch (error) {
     Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del aislamiento.',
      confirmButtonColor: '#d33'
    });
  };
};

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const isolationId = document.getElementById('edit-isolation-id').value;
  const updatedData = {
    id_incidente_gallina: document.getElementById('edit-idIncidentGallina').value,
    id_galpon: document.getElementById('edit_id_galpon').value,
  };


  try {
    await isolationService.updateIsolation(isolationId, updatedData);
    modalInstance.hide();
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del aislamiento.',
      confirmButtonColor: '#d33'
    });
  }
}

async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-isolation');
  if (editButton) {
    const idAislamiento = editButton.dataset.isolationId;
    openEditModal(idAislamiento);
    return;
  }
}

async function handleCreateSubmit(event) {
  event.preventDefault();

  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())} ${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}`;

  const newIsolationData = {
    id_incidente_gallina: document.getElementById('create-id_incident_gallina').value,
    id_galpon: document.getElementById('create_id_galpon').value,
    fecha_hora: fechaPC,
  };

  try {
    await isolationService.createIsolation(newIsolationData);
    if (createModalInstance) createModalInstance.hide();
    document.getElementById('create-isolation-form').reset();
    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Aislamiento creado correctamente.',
      confirmButtonColor: '#28a745'
    });
    init();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al crear el aislamiento',
      confirmButtonColor: '#d33'
    });
  }
}

// Modificar la función init para que pase correctamente los filtros a la paginación
function renderPagination(total_pages, currentPage = 1) {
  const container = document.querySelector("#pagination");
  if (!container) return;

  container.innerHTML = "";
  
  const anterior = document.createElement("button");
  anterior.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
  anterior.textContent = "<";
  anterior.addEventListener("click", () => {
    const prevPage = currentPage === 1 ? total_pages : currentPage - 1;
    init(prevPage, 10, activeFechaInicio, activeFechaFin);
  });
  container.appendChild(anterior);

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(total_pages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    const first = createPageButton(1, currentPage);
    container.appendChild(first);
    if (startPage > 2) {
      container.appendChild(createDots());
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    container.appendChild(createPageButton(i, currentPage));
  }

  if (endPage < total_pages) {
    if (endPage < total_pages - 1) {
      container.appendChild(createDots());
    }
    const last = createPageButton(total_pages, currentPage);
    container.appendChild(last);
  }
  
  const next = document.createElement("button");
  next.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
  next.textContent = ">";
  next.addEventListener("click", () => {
    const nextPage = currentPage === total_pages ? 1 : currentPage + 1;
    init(nextPage, 10, activeFechaInicio, activeFechaFin);
  });
  container.appendChild(next);
}
function createPageButton(page, currentPage) {
  const btn = document.createElement("button");
  btn.textContent = page;
  btn.disabled = page === currentPage;
  btn.classList.add('btn', 'btn-sm', 'btn-outline-primary', 'mx-1', 'border', 'border-success', 'my-2');
  btn.addEventListener("click", () => init(page, 10, activeFechaInicio, activeFechaFin));
  return btn;
}

function createDots() {
  const span = document.createElement("span");
  span.textContent = "...";
  span.classList.add('mx-2');
  return span;
}

async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  const tableBody = document.getElementById('isolations-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando aislamientos...</td></tr>';

  try {
    const data = await fetchIsolations(page, page_size, activeFechaInicio, activeFechaFin);
    const aislamientos = data.isolation || [];

    if (aislamientos.length > 0) {
      tableBody.innerHTML = aislamientos.map(createIsolationRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron aislamientos.</td></tr>';
    
      if (activeFechaInicio && activeFechaFin) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center">
                  <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron aislamientos en el rango de fechas:<br>
                    <strong>${activeFechaInicio} a ${activeFechaFin}</strong>
                  </div>
                </td>
              </tr>
            `;
      } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron aislamientos.</td></tr>';
        }
      }

    renderPagination(data.total_pages || 1, page);

    const editForm = document.getElementById('edit-isolation-form');
    const createForm = document.getElementById('create-isolation-form');
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    editForm.removeEventListener('submit', handleUpdateSubmit);
    editForm.addEventListener('submit', handleUpdateSubmit);
    createForm.removeEventListener('submit', handleCreateSubmit);
    createForm.addEventListener('submit', handleCreateSubmit);

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
  }
}

const BuscarAislamiento = document.getElementById('search-isolation');

BuscarAislamiento.addEventListener('input', () => {
  const filter = BuscarAislamiento.value.toLowerCase();
  const tableBody = document.getElementById('isolations-table-body');
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    // Obtener celdas relevantes: ID, fecha, galpón
    const idCell = row.cells[0]?.textContent.toLowerCase() || '';
    const fechaCell = row.cells[1]?.textContent.toLowerCase() || '';
    const galponCell = row.cells[2]?.textContent.toLowerCase() || '';

    // Mostrar si alguna celda contiene el texto buscado
    const match = idCell.includes(filter) || fechaCell.includes(filter) || galponCell.includes(filter);
    row.style.display = match ? '' : 'none';
  });
});

function limpiarFiltros() {
  activeFechaInicio = "";
  activeFechaFin = "";
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  init(1, 10);
}

const btnClear = document.getElementById('btn_clear_filters');
btnClear.addEventListener('click', limpiarFiltros);

const createModal = document.getElementById('exampleModal');
createModal.addEventListener('show.bs.modal', loadGalponesSelectCreate);

// Modal de filtro de fechas
const filterModalEl = document.getElementById('filterDateModal');
const filterModal = new bootstrap.Modal(filterModalEl);

// Botón para abrir modal
document.getElementById("btn_open_date_filter").addEventListener("click", () => {
  filterModal.show();
});

// Botón para aplicar filtro
document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  filtrarAislamientos(fechaInicio, fechaFin);

  // Cerrar modal
  filterModal.hide();
});


function convertToCSV(rows, columns) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    // Escape quotes
    return `"${s.replace(/"/g, '""')}"`;
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

async function exportToPDF(data, filename = "aislamientos.pdf") {
  const sanitizedData = data.map(row => ({
    id_aislamiento: row.id_aislamiento || "",
    fecha_hora: row.fecha_hora || "",
    id_incidente_gallina: row.id_incidente_gallina || "",
    id_galpon: row.id_galpon || "",
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
  doc.text("Reporte de Aislamientos", 14, 15);

  const columns = [
    { header: "Id", dataKey: "id_aislamiento" },
    { header: "Fecha y hora", dataKey: "fecha_hora" },
    { header: "Incidente N.", dataKey: "id_incidente_gallina" },
    { header: "Galpón", dataKey: "id_galpon" },
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



function exportToCSV(data, filename = "aislamientos.csv") {
  const columns = [
    { header: "ID", key: "id_aislamiento" },
    { header: "Fecha y hora", key: "fecha_hora" },
    { header: "Incidente N.", key: "id_incidente_gallina" },
    { header: "id galpon", key: "id_galpon" },
    // { header: "Latitud", key: "latitud" },
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "aislamientos.xlsx") {
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
    "Id aislamiento": r.id_aislamiento,
    "Fecha y hora": r.fecha_hora,
    "Id incidente gallina": r.id_incidente_gallina,
    "Id galpón origen": r.id_galpon,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asilamiento");

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

async function handleExportClick(event) {

  const item = event.target.closest(".export-format");
  if (!item) return;

  event.preventDefault();

  const fmt = item.dataset.format;
  const dateTag = new Date().toISOString().slice(0, 10);

  let response;

  // 👉 Si NO hay filtros, llamar API normal
  if (!activeFechaInicio || !activeFechaFin) {
    response = await fetchIsolations(1, 1000);
  } 
  // 👉 Si hay filtros, enviarlos formateados
  else {
    const fechaInicio = formatDateForAPI(activeFechaInicio);
    const fechaFin = formatDateForAPI(activeFechaFin);
    response = await fetchIsolations(1, 1000, fechaInicio, fechaFin);
  }

  const data = response?.isolation || [];

  if (data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `aislamientos_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `aislamientos_${dateTag}.xlsx`);
  } else if (fmt === "pdf") {
    exportToPDF(data, `aislamientos_${dateTag}.pdf`);
  }
}


document.addEventListener("click", (e) => {
  const item = e.target.closest(".export-format");
  if (!item) return;
  handleExportClick(e);
});


init(1, 10);

export { init };
