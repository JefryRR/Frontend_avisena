import { incident_chickenService } from '../js/incident_chicken.service.js';

let modalInstance = null;
let createModalInstance = null;
let activeFechaInicio = "";
let activeFechaFin = "";

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
function createIncidentRow(incident) {
  const incidentId = incident.id_inc_gallina;

  const fecha = new Date(incident.fecha_hora);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true
  });

  return `
    <tr>
      <td class="px-0">${incident.nombre}</td>
      <td class="px-0">${incident.tipo_incidente}</td>
      <td class="px-0">${incident.cantidad}</td>
      <td class="px-0">${incident.descripcion}</td>
      <td class="px-0">
        <div class="form-check form-switch ms-2 d-inline-block">
          <input class="form-check-input incident-status-switch" type="checkbox" role="switch" 
                 id="switch-${incidentId}" data-incident-id="${incidentId}" 
                 ${incident.esta_resuelto ? 'checked' : ''}>
          <label class="form-check-label" for="switch-${incidentId}">
            ${incident.esta_resuelto ? 'Resuelto' : 'Pendiente'}
          </label>
        </div>
      </td>
      <td class="px-0">${fechaFormateada}</td>
      <td class="text-end justify-content-end gap-2">
        <button class="btn btn-sm btn-success btn-edit-incident" data-incident-id="${incidentId}" aria-label="Editar">
          <i class="fa-regular fa-pen-to-square me-0"></i>
        </button>
      </td>
    </tr>
  `;
}

//____________________formato_para_exportar_por_fechas______________________________
function formatDateForAPI(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

//______________________________paginación para todos los datos y filtrados_____________
async function fetchIncidents(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
  const token = localStorage.getItem('access_token');
  let url;

  if (fechaInicio && fechaFin) {
    url = `https://proyecto-sena-oatr.onrender.com/incident/rango-fechas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&page=${page}&page_size=${page_size}`;
  } else {
    url = `https://proyecto-sena-oatr.onrender.com/incident/all_incidentes-gallinas-pag?page=${page}&limit=${page_size}`;
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
        incidents: [],
        total_incidents: 0,
        total_pages: 0,
        page: page,
        page_size: page_size
      };
    }

    if (!res.ok) throw new Error(`Error al cargar incidentes: ${res.status}`);

    const json = await res.json();
    return json;
  } catch (error) {
    throw error;
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

//______________________ para filtrar por fechas_______________________________________
function filtrarIncidentes(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      icon: 'info',
      title: 'Error',
      text: 'Debe seleccionar ambas fechas',
      confirmButtonColor: 'rgba(51, 136, 221, 1)'
    });
    return;
  }

  // Guardar fechas para usar en fetchIncidents
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  // Recargar la tabla desde la página 1 con el filtro
  init(1, 10);
}

// Botón para aplicar filtro
document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  filtrarIncidentes(fechaInicio, fechaFin);
});

//_____________selects para que cargen los nombres de la tabla galpon del create y edit_______________
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
          dropdownParent: $('#createIncidenteGallinaModal'),
          width: '100%',
          placeholder: 'Selecciona un galpón',
          allowClear: true,
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

// FUNCIÓN CORREGIDA: Cargar tipos de incidente en creación
function loadTiposIncidenteCreate() {
  const select = document.getElementById('tipo_incidente_create');
  const tipos = [
    "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
    "Produccion", "Alimentacion", "Plaga", "Estres termico", "Otro"
  ];

  select.innerHTML = '<option value="">Seleccione un tipo</option>';

  tipos.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
  });
}

const createModal = document.getElementById('createIncidenteGallinaModal');
createModal.addEventListener('show.bs.modal', function() {
  loadGalponesSelectCreate();
  loadTiposIncidenteCreate();
});

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
      if (g.id_galpon == selectedId) option.selected = true;
      select.appendChild(option);
    });

  } catch (error) {
    select.innerHTML = '<option value="">Error al cargar galpones</option>';
  }
}

// Función para cargar tipos de incidente en el select de edición
function loadTiposIncidenteEdit(selectedTipo) {
  const select = document.getElementById('edit-tipo_incidente');
  const tipos = [
    "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
    "Produccion", "Alimentacion", "Plaga", "Estres termic", "Otro"
  ];

  select.innerHTML = '<option value="">Seleccione un tipo</option>';

  tipos.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    if (tipo === selectedTipo) option.selected = true;
    select.appendChild(option);
  });
}

//___________para abrir el modal de edit - CORREGIDO _________________________________________
async function openEditModal(id_incidente_gallina) {
  const modalElement = document.getElementById('editIncidenteGallinaModal');
  
  // Usar getOrCreateInstance en lugar de new bootstrap.Modal
  modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);

  try {
    console.log("Abriendo modal para incidente:", id_incidente_gallina);
    
    // Obtener datos del incidente - CORREGIDO: usar el método correcto del service
    const incident = await incident_chickenService.getChickenIncidentById(id_incidente_gallina);
    console.log("Datos del incidente:", incident);

    // Llenar el formulario con los datos
    document.getElementById('edit-id_inc_gallina').value = incident.id_inc_gallina;
    document.getElementById('edit-cantidad').value = incident.cantidad;
    document.getElementById('edit-descripcion').value = incident.descripcion;
    
    // CORREGIDO: Usar galpon_origen en lugar de id_galpon
    await loadGalponesSelectEdit(incident.galpon_origen);
    loadTiposIncidenteEdit(incident.tipo_incidente);
    
    // Mostrar modal
    modalInstance.show();
    
  } catch (error) {
    console.error("Error al abrir modal:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los datos del incidente: ' + error.message,
      confirmButtonColor: '#d33'
    });
  }
}

async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-incident');
  if (editButton) {
    const idIncidente = editButton.dataset.incidentId;
    console.log("Edit button clicked, ID:", idIncidente);
    await openEditModal(idIncidente);
    return;
  }
}

// --- MANEJADORES DE EVENTOS ---
const createIncidenteModalEl = document.getElementById('createIncidenteGallinaModal');
const createIncidenteModalInstance = bootstrap.Modal.getOrCreateInstance(createIncidenteModalEl);

// CORREGIDO: Usar la estructura correcta con galpon_origen
async function handleUpdateSubmit(event) {
  event.preventDefault();
  
  const incidentId = document.getElementById('edit-id_inc_gallina').value;
  
  // CORREGIDO: Usar galpon_origen en lugar de id_galpon
  const updatedData = {
    galpon_origen: parseInt(document.getElementById('edit_id_galpon').value),
    tipo_incidente: document.getElementById('edit-tipo_incidente').value,
    cantidad: parseInt(document.getElementById('edit-cantidad').value),
    descripcion: document.getElementById('edit-descripcion').value
  };

  console.log("Actualizando incidente:", incidentId, updatedData);

  try {
    // CORREGIDO: Usar el método correcto del service
    await incident_chickenService.updateChickenIncident(incidentId, updatedData);
    
    // Cerrar modal
    modalInstance.hide();
    
    // Recargamos la tabla para ver los cambios
    init();
    
  } catch (error) {
    console.error("Error al actualizar:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo actualizar el incidente: ' + (error.message || 'Error desconocido'),
      confirmButtonColor: '#d33'
    });
  }
}

// CORREGIDO: Usar la estructura correcta con galpon_origen para creación
async function handleCreateSubmit(event) {
  event.preventDefault();

  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())} ${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}`;

  // CORREGIDO: Usar galpon_origen en lugar de id_galpon
  const newIncidentData = {
    galpon_origen: parseInt(document.getElementById('create_id_galpon').value),
    tipo_incidente: document.getElementById('tipo_incidente_create').value,
    cantidad: parseInt(document.getElementById('cantidad').value),
    descripcion: document.getElementById('description').value,
    fecha_hora: fechaPC,
    esta_resuelto: false
  };

  console.log("Creando nuevo incidente:", newIncidentData);

  // Validaciones
  if (!newIncidentData.galpon_origen || newIncidentData.galpon_origen <= 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'Debe seleccionar un galpón válido',
      confirmButtonColor: '#d33'
    });
    return;
  }

  if (!newIncidentData.tipo_incidente) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'Debe seleccionar un tipo de incidente',
      confirmButtonColor: '#d33'
    });
    return;
  }

  if (!newIncidentData.cantidad || newIncidentData.cantidad < 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error de validación',
      text: 'La cantidad debe ser un número positivo',
      confirmButtonColor: '#d33'
    });
    return;
  }

  try {
    await incident_chickenService.createChickenIncident(newIncidentData);

    // Cerrar modal ANTES, pero sin mostrar SweetAlert todavía
    createIncidenteModalInstance.hide();

    // Esperar a que Bootstrap termine de cerrar el modal
    createIncidenteModalEl.addEventListener('hidden.bs.modal', function handler() {
      // remover el listener (muy importante para evitar ejecuciones duplicadas)
      createIncidenteModalEl.removeEventListener('hidden.bs.modal', handler);

      // resetear formulario
      document.getElementById('create-incidente-gallina-form').reset();

      // mostrar alerta
      Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Incidente creado correctamente.',
        confirmButtonColor: '#28a745'
      });

      // recargar datos
      init();
    });

  } catch (error) {
    console.error("Error al crear incidente:", error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error al crear el incidente: ' + (error.message || 'Error desconocido'),
      confirmButtonColor: '#d33'
    });
  }
}

// Manejar cambio de estado
async function handleStatusSwitch(event) {
  const switchElement = event.target;

  if (!switchElement.classList.contains('incident-status-switch')) return;

  const incidentId = switchElement.dataset.incidentId;
  const newStatus = switchElement.checked;
  const actionText = newStatus ? 'resuelto' : 'pendiente';

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: `¿Deseas cambiar a ${actionText} este incidente?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await incident_chickenService.changeChickenStatus(incidentId, newStatus);

      const label = switchElement.nextElementSibling;
      if (label) label.textContent = newStatus ? 'Resuelto' : 'Pendiente';

      await Swal.fire({
        icon: 'success',
        title: '¡Guardado!',
        text: 'Se cambio exitosamente.',
        confirmButtonColor: '#28a745'
      });

    } catch (error) {
      console.error("Error:", error);
      switchElement.checked = !newStatus;
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el estado del incidente: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  } else {
    switchElement.checked = !newStatus;
  }
}

//____________________________________buscador inteligente____________________________________
const BuscarIncidente = document.getElementById('search-incidente-gallina');

BuscarIncidente.addEventListener('input', () => {
  const filter = BuscarIncidente.value.toLowerCase();
  const tableBody = document.getElementById('incidente-gallina-table-body');
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    // Obtener celdas relevantes: galpón, tipo, cantidad, descripción, estado, fecha
    const galponCell = row.cells[0]?.textContent.toLowerCase() || '';
    const tipoCell = row.cells[1]?.textContent.toLowerCase() || '';
    const cantidadCell = row.cells[2]?.textContent.toLowerCase() || '';
    const descripcionCell = row.cells[3]?.textContent.toLowerCase() || '';
    const estadoCell = row.cells[4]?.textContent.toLowerCase() || '';
    const fechaCell = row.cells[5]?.textContent.toLowerCase() || '';

    // Mostrar si alguna celda contiene el texto buscado
    const match = galponCell.includes(filter) || 
                  tipoCell.includes(filter) || 
                  cantidadCell.includes(filter) || 
                  descripcionCell.includes(filter) || 
                  estadoCell.includes(filter) || 
                  fechaCell.includes(filter);
    row.style.display = match ? '' : 'none';
  });
});

//_______________________________ limpiador de filtros__________________________________________
function limpiarFiltros() {
  activeFechaInicio = "";
  activeFechaFin = "";
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  document.getElementById("search-incidente-gallina").value = "";
  init(1, 10);
}

const btnClear = document.getElementById('btn_clear_filters');
btnClear.addEventListener('click', limpiarFiltros);

async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  const tableBody = document.getElementById('incidente-gallina-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando incidentes...</td></tr>';

  try {
    const data = await fetchIncidents(page, page_size, activeFechaInicio, activeFechaFin);
    const incidentes = data.incidents || [];

    if (incidentes.length > 0) {
      tableBody.innerHTML = incidentes.map(createIncidentRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron incidentes.</td></tr>';
    
      if (activeFechaInicio && activeFechaFin) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center">
                  <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron incidentes en el rango de fechas:<br>
                    <strong>${activeFechaInicio} a ${activeFechaFin}</strong>
                  </div>
                </td>
              </tr>
            `;
      } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron incidentes.</td></tr>';
        }
      }

    renderPagination(data.total_pages || 1, page);

    // Configurar event listeners
    const editForm = document.getElementById('edit-incidente-gallina-form');
    const createForm = document.getElementById('create-incidente-gallina-form');
    
    // Remover listeners antiguos y agregar nuevos
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    
    tableBody.removeEventListener('change', handleStatusSwitch);
    tableBody.addEventListener('change', handleStatusSwitch);
    
    if (editForm) {
      editForm.removeEventListener('submit', handleUpdateSubmit);
      editForm.addEventListener('submit', handleUpdateSubmit);
    }
    
    if (createForm) {
      createForm.removeEventListener('submit', handleCreateSubmit);
      createForm.addEventListener('submit', handleCreateSubmit);
    }

  } catch (error) {
    console.error("Error en init:", error);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos: ${error.message}</td></tr>`;
  }
}

//_____________________para exportar archivos excel, CSV, pdf_______________________________________
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

async function exportToPDF(data, filename = "incidentes_gallinas.pdf") {
  const sanitizedData = data.map(row => ({
    nombre: row.nombre || "",
    tipo_incidente: row.tipo_incidente || "",
    cantidad: row.cantidad || "",
    descripcion: row.descripcion || "",
    esta_resuelto: row.esta_resuelto ? "Resuelto" : "Pendiente",
    fecha_hora: row.fecha_hora || "",
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
  doc.text("Reporte de Incidentes Gallina", 14, 15);

  const columns = [
    { header: "Galpón", dataKey: "nombre" },
    { header: "Tipo Incidente", dataKey: "tipo_incidente" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Descripción", dataKey: "descripcion" },
    { header: "Estado", dataKey: "esta_resuelto" },
    { header: "Fecha y Hora", dataKey: "fecha_hora" },
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

function exportToCSV(data, filename = "incidentes_gallinas.csv") {
  const columns = [
    { header: "Galpón", key: "nombre" },
    { header: "Tipo Incidente", key: "tipo_incidente" },
    { header: "Cantidad", key: "cantidad" },
    { header: "Descripción", key: "descripcion" },
    { header: "Estado", key: "esta_resuelto" },
    { header: "Fecha y Hora", key: "fecha_hora" },
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "incidentes_gallinas.xlsx") {
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
    "Galpón": r.nombre,
    "Tipo Incidente": r.tipo_incidente,
    "Cantidad": r.cantidad,
    "Descripción": r.descripcion,
    "Estado": r.esta_resuelto ? "Resuelto" : "Pendiente",
    "Fecha y Hora": r.fecha_hora,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incidentes Gallina");

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
    response = await fetchIncidents(1, 1000);
  } 
  // 👉 Si hay filtros, enviarlos formateados
  else {
    const fechaInicio = formatDateForAPI(activeFechaInicio);
    const fechaFin = formatDateForAPI(activeFechaFin);
    response = await fetchIncidents(1, 1000, fechaInicio, fechaFin);
  }

  const data = response?.incidents || [];

  if (data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `incidentes_gallinas_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `incidentes_gallinas_${dateTag}.xlsx`);
  } else if (fmt === "pdf") {
    exportToPDF(data, `incidentes_gallinas_${dateTag}.pdf`);
  }
}

document.addEventListener("click", (e) => {
  const item = e.target.closest(".export-format");
  if (!item) return;
  handleExportClick(e);
});

// Inicialización de tipos de incidente al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  loadTiposIncidenteCreate();
  
  // Configurar event listener para el formulario de creación
  const createForm = document.getElementById('create-incidente-gallina-form');
  if (createForm) {
    createForm.addEventListener('submit', handleCreateSubmit);
  }
});

init(1, 10);

export { init };