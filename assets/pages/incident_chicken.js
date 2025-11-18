import { incident_chickenService } from '../js/incident_chicken.service.js';

let modalInstance = null;
let createModalInstance = null;
let activeFechaInicio = "";
let activeFechaFin = "";

async function handleStatusSwitch(event) {
  const switchElement = event.target;

  if (!switchElement.classList.contains('incident_chicken-status-switch')) return;

  const incident_chickenId = switchElement.dataset.user_id;
  const newStatus = switchElement.checked;
  const actionText = newStatus ? 'resuelto' : 'pendiente';

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: `¿Deseas cambiar a ${actionText} este incidente?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await incident_chickenService.changeChickenStatus(incident_chickenId, newStatus);

      const label = switchElement.nextElementSibling;
      if (label) label.textContent = newStatus ? 'Resuelto' : 'Pendiente';

      await Swal.fire({
        title: '¡Éxito!',
        text: `El incidente ha sido cambiado a ${newStatus ? 'resuelto' : 'pendiente'} exitosamente.`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

    } catch (error) {
      console.error("Error:", error);
      switchElement.checked = !newStatus;

      await Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el estado del incidente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  } else {
    switchElement.checked = !newStatus;
  }
}

function createIncident_chickenRow(incident) {
  const incident_chickenId = incident.id_inc_gallina;

  const fecha = new Date(incident.fecha_hora);
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
            <h6 class="text-black">${incident.nombre}</h6>
          </div>
        </div>
      </td>
      <td class="px-0">${incident.tipo_incidente}</td>
      <td class="px-0">${incident.cantidad}</td>
      <td class="px-0">${incident.descripcion}</td>
      <td class="px-0">
        <div class="form-check form-switch ms-2 d-inline-block">
            <input class="form-check-input incident_chicken-status-switch" type="checkbox" role="switch" 
                   id="switch-${incident_chickenId}" data-user_id="${incident_chickenId}" 
                   ${incident.esta_resuelto ? 'checked' : ''}>
            <label class="form-check-label" for="switch-${incident_chickenId}">
              ${incident.esta_resuelto ? 'Resuelto' : 'Pendiente'}
            </label>
        </div>
      </td>
      <td class="px-0">${fechaFormateada}</td>
      <td class="px-0 text-end">
          <button class="btn btn-sm btn-success btn-edit-incident_chicken" data-id-incidente-gallina="${incident_chickenId}">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
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

async function fetchIncident_chicken(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
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

function filtrarIncidentes(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      title: 'Fechas incompletas',
      text: 'Por favor selecciona ambas fechas.',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;
  init(1, 10);
}

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

      select.innerHTML = '<option value="">Selecciona un galpón</option>';
      galpones.forEach(g => {
        const option = document.createElement('option');
        option.value = g.id_galpon;
        option.textContent = g.nombre;
        select.appendChild(option);
      });

      if (window.$ && $(select).select2) {
        $(document).ready(function () {
          $('#create_id_galpon').select2({
            dropdownParent: $('#exampleModal'),
            width: '100%',
            placeholder: 'Selecciona un galpón',
            allowClear: true,
            dropdownCssClass: 'select2-scroll',
            matcher: function (params, data) {
              if ($.trim(params.term) === '') return data;

              const term = params.term.toLowerCase();
              const text = (data.text || '').toLowerCase();
              const id = (data.id || '').toLowerCase();

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
      await Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los galpones',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }

// Variables globales
let modalInstanceEdit = null;

// Función para cargar galpones en el select de edición
async function loadGalponesSelectEdit(selectedId) {
  const select = document.getElementById('edit_id_galpon');
  select.innerHTML = '<option value="">Cargando galpones...</option>';

  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch('https://proyecto-sena-oatr.onrender.com/sheds/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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
    console.error('Error:', error);
    select.innerHTML = '<option value="">Error al cargar galpones</option>';
    await Swal.fire({
      title: 'Error',
      text: 'No se pudieron cargar los galpones',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Función para cargar tipos de incidente en el select de edición
function loadTiposIncidenteEdit(selectedTipo) {
  const select = document.getElementById('edit-tipo_incidente');
  const tipos = [
    "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
    "Produccion", "Alimentacion", "Plaga", "Estres termico", "Otro"
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

// Función para abrir el modal de edición
async function openEditModal(id_incidente_gallina) {
  const modalElement = document.getElementById('editIncidenteGallinaModal');

  // Inicializar modal si no existe
  if (!modalInstanceEdit) {
    modalInstanceEdit = new bootstrap.Modal(modalElement);
  }

  try {
    // Obtener datos del incidente (ajusta según tu servicio)
    const incidente = await incident_chickenService.getChickenIncidentById(id_incidente_gallina);

    // Llenar el formulario con los datos
    document.getElementById('edit-id_inc_gallina').value = incidente.id_incidente_gallina;
    document.getElementById('edit-cantidad').value = incidente.cantidad || '';
    document.getElementById('edit-descripcion').value = incidente.descripcion || '';

    // Cargar selects
    await loadGalponesSelectEdit(incidente.id_galpon);
    loadTiposIncidenteEdit(incidente.tipo_incidente);

    // Mostrar modal
    modalInstanceEdit.show();

  } catch (error) {
    console.error('Error al cargar datos:', error);
    await Swal.fire({
      title: 'Error',
      text: 'No se pudieron cargar los datos del incidente.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Manejar envío del formulario de edición
async function handleUpdateSubmit(event) {
  event.preventDefault();

  const idIncidenteGallina = document.getElementById('edit-id_inc_gallina').value;
  const updatedData = {
    id_galpon: document.getElementById('edit_id_galpon').value,
    tipo_incidente: document.getElementById('edit-tipo_incidente').value,
    cantidad: document.getElementById('edit-cantidad').value,
    descripcion: document.getElementById('edit-descripcion').value
  };

  try {
    // Actualizar incidente (ajusta según tu servicio)
    await incident_chickenService.updateIncidente(idIncidenteGallina, updatedData);

    // Cerrar modal
    modalInstanceEdit.hide();

    await Swal.fire({
      title: '¡Éxito!',
      text: 'Incidente actualizado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    // Recargar datos (ajusta según tu función de inicialización)
    init();

  } catch (error) {
    console.error('Error al actualizar:', error);
    await Swal.fire({
      title: 'Error',
      text: 'No se pudo actualizar el incidente.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Manejar clics en la tabla
async function handleTableClick(event) {
  const editButton = event.target.closest('.btn-edit-incident_chicken');
  if (editButton) {
    const id_incidenteGallina = editButton.dataset.idIncidenteGallina;  // <- CORREGIDO
    await openEditModal(id_incidenteGallina);
  }
}


// Función para cargar galpones en creación (si es necesario)
async function cargarGalpones() {
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch('https://proyecto-sena-oatr.onrender.com/sheds/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Error al cargar galpones');

    const galpones = await res.json();
    const select = document.getElementById('create_id_galpon');

    select.innerHTML = '<option value="">Seleccione un galpón</option>';

    galpones.forEach(galpon => {
      const option = document.createElement('option');
      option.value = galpon.id_galpon;
      option.textContent = galpon.nombre;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error al cargar galpones:', error);
    await Swal.fire({
      title: 'Error',
      text: 'No se pudieron cargar los galpones',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

// Función para cargar tipos de incidente en creación
function cargarTiposIncidente() {
  const tipos = [
    "Enfermedad", "Herida", "Muerte", "Fuga", "Ataque Depredador",
    "Produccion", "Alimentacion", "Plaga", "Estres termico", "Otro"
  ];

  const select = document.getElementById('tipo_incidente_create');
  select.innerHTML = '<option value="">Seleccione un tipo</option>';

  tipos.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
  });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
  // Asignar event listeners
  const editForm = document.getElementById('edit-incidente-gallina-form');
  if (editForm) {
    editForm.addEventListener('submit', handleUpdateSubmit);
  }

  const table = document.querySelector('table'); // Ajusta el selector según tu tabla
  if (table) {
    table.addEventListener('click', handleTableClick);
  }

  // Cargar datos iniciales para creación
  cargarGalpones();
  cargarTiposIncidente();
});
// Inicialización
document.addEventListener('DOMContentLoaded', function () {
  // Asignar event listeners
  const editForm = document.getElementById('edit-incidente-gallina-form');
  if (editForm) {
    editForm.addEventListener('submit', handleUpdateSubmit);
  }

  const table = document.querySelector('table'); // Ajusta el selector según tu tabla
  if (table) {
    table.addEventListener('click', handleTableClick);
  }

  // Cargar datos iniciales para creación
  cargarGalpones();
  cargarTiposIncidente();
});

async function handleCreateSubmit(event) {
  event.preventDefault();

  const fechaLocal = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const fechaPC = `${fechaLocal.getFullYear()}-${pad(fechaLocal.getMonth() + 1)}-${pad(fechaLocal.getDate())} ${pad(fechaLocal.getHours())}:${pad(fechaLocal.getMinutes())}:${pad(fechaLocal.getSeconds())}`;

  const newIncidentData = {
    galpon_origen: parseInt(document.getElementById('create_id_galpon').value),
    tipo_incidente: document.getElementById('tipo_incidente_create').value,
    cantidad: parseInt(document.getElementById('cantidad').value),
    descripcion: document.getElementById('description').value,
    esta_resuelto: false,
    fecha_hora: fechaPC,
  };

  if (newIncidentData.galpon_origen <= 0) {
    await Swal.fire({
      title: 'Error de validación',
      text: 'El ID del galpón debe ser mayor a cero',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  if (newIncidentData.cantidad < 0) {
    await Swal.fire({
      title: 'Error de validación',
      text: 'La cantidad no puede ser negativa',
      icon: 'warning',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  try {
    await incident_chickenService.createChickenIncident(newIncidentData);

    const modal = bootstrap.Modal.getInstance(document.getElementById('createIncidenteGallinaModal'));
    modal.hide();
    document.getElementById('create-incidente-gallina-form').reset();

    await Swal.fire({
      title: '¡Éxito!',
      text: 'Incidente creado exitosamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });

    if (typeof init === 'function') {
      init();
    }
  } catch (error) {
    console.error('Error al crear incidente:', error);

    let errorMessage = 'No se pudo crear el incidente. Verifica los datos e intenta nuevamente.';

    if (error.message && error.message.includes('404')) {
      errorMessage = 'El galpón seleccionado no existe';
    } else if (error.message && error.message.includes('401')) {
      errorMessage = 'No tienes permisos para crear incidentes';
    }

    await Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

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

  const tableBody = document.getElementById('incidente-gallina-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando incidentes gallina...</td></tr>';

  try {
    const data = await fetchIncident_chicken(page, page_size, activeFechaInicio, activeFechaFin);
    const incidentes_g = data.incidents || [];

    if (incidentes_g.length > 0) {
      tableBody.innerHTML = incidentes_g.map(createIncident_chickenRow).join('');
    } else {
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
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron incidentes de gallinas.</td></tr>';
      }
    }

    renderPagination(data.total_pages || 1, page);

    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    tableBody.removeEventListener('change', handleStatusSwitch);
    tableBody.addEventListener('change', handleStatusSwitch);
    tableBody.removeEventListener('submit', handleUpdateSubmit);
    tableBody.addEventListener('submit', handleUpdateSubmit);

  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
  }
}

const BuscarIncidenteGallina = document.getElementById('search-incidente-gallina');

BuscarIncidenteGallina.addEventListener('input', () => {
  const filter = BuscarIncidenteGallina.value.toLowerCase();
  const tableBody = document.getElementById('incidente-gallina-table-body');
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const idCell = row.cells[0]?.textContent.toLowerCase() || '';
    const fechaCell = row.cells[1]?.textContent.toLowerCase() || '';
    const galponCell = row.cells[2]?.textContent.toLowerCase() || '';
    const tipoCell = row.cells[3]?.textContent.toLowerCase() || '';
    const cantidadCell = row.cells[4]?.textContent.toLowerCase() || '';
    const descripcionCell = row.cells[5]?.textContent.toLowerCase() || '';
    const estadoCell = row.cells[6]?.textContent.toLowerCase() || '';

    const match = idCell.includes(filter) ||
      fechaCell.includes(filter) ||
      galponCell.includes(filter) ||
      tipoCell.includes(filter) ||
      cantidadCell.includes(filter) ||
      descripcionCell.includes(filter) ||
      estadoCell.includes(filter);

    row.style.display = match ? '' : 'none';
  });
});

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

const createModal = document.getElementById('createIncidenteGallinaModal');
createModal.addEventListener('show.bs.modal', loadGalponesSelectCreate);

const filterModalEl = document.getElementById('filterDateModal');
const filterModal = new bootstrap.Modal(filterModalEl);

document.getElementById("btn_open_date_filter").addEventListener("click", () => {
  filterModal.show();
});

document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
  const fechaInicio = document.getElementById("fecha-inicio").value;
  const fechaFin = document.getElementById("fecha-fin").value;

  filtrarIncidentes(fechaInicio, fechaFin);
  filterModal.hide();
});

function convertToCSV(rows, columns) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
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
    id_inc_gallina: row.id_inc_gallina || "",
    fecha_hora: row.fecha_hora || "",
    nombre: row.nombre || "",
    tipo_incidente: row.tipo_incidente || "",
    cantidad: row.cantidad || "",
    descripcion: row.descripcion || "",
    esta_resuelto: row.esta_resuelto ? "Resuelto" : "Pendiente"
  }));

  if (!window.jspdf) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  }

  if (!window.jspdfAutoTable) {
    await loadScript("https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  if (typeof doc.autoTable !== "function") {
    console.error("autoTable no se cargó correctamente");
    return;
  }

  doc.setFontSize(16);
  doc.text("Reporte de Incidentes Gallina", 14, 15);

  const columns = [
    { header: "ID", dataKey: "id_inc_gallina" },
    { header: "Fecha y Hora", dataKey: "fecha_hora" },
    { header: "Galpón", dataKey: "nombre" },
    { header: "Tipo Incidente", dataKey: "tipo_incidente" },
    { header: "Cantidad", dataKey: "cantidad" },
    { header: "Descripción", dataKey: "descripcion" },
    { header: "Estado", dataKey: "esta_resuelto" }
  ];

  doc.autoTable({ columns, body: sanitizedData, startY: 25, styles: { fontSize: 8 } });
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
    { header: "ID", key: "id_inc_gallina" },
    { header: "Fecha y Hora", key: "fecha_hora" },
    { header: "Galpón", key: "nombre" },
    { header: "Tipo Incidente", key: "tipo_incidente" },
    { header: "Cantidad", key: "cantidad" },
    { header: "Descripción", key: "descripcion" },
    { header: "Estado", key: "esta_resuelto" }
  ];
  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8;", filename);
}

async function exportToExcel(data, filename = "incidentes_gallinas.xlsx") {
  const loadSheetJS = () =>
    new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = () => resolve(window.XLSX);
      script.onerror = (e) => reject(new Error("No se pudo cargar SheetJS"));
      document.head.appendChild(script);
    });

  try {
    await loadSheetJS();
  } catch (err) {
    console.warn("SheetJS no disponible, se usará exportación CSV en su lugar", err);
    exportToCSV(data, filename.replace(/\.xlsx?$/, ".csv"));
    return;
  }

  const rows = data.map((r) => ({
    "ID Incidente": r.id_inc_gallina,
    "Fecha y Hora": r.fecha_hora,
    "Galpón": r.nombre,
    "Tipo Incidente": r.tipo_incidente,
    "Cantidad": r.cantidad,
    "Descripción": r.descripcion,
    "Estado": r.esta_resuelto ? "Resuelto" : "Pendiente"
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Incidentes Gallina");

  try {
    XLSX.writeFile(wb, filename);
  } catch (e) {
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
      await Swal.fire({
        title: 'Error',
        text: 'Error al generar el archivo Excel.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
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

  try {
    if (!activeFechaInicio || !activeFechaFin) {
      response = await fetchIncident_chicken(1, 1000);
    } else {
      const fechaInicio = formatDateForAPI(activeFechaInicio);
      const fechaFin = formatDateForAPI(activeFechaFin);
      response = await fetchIncident_chicken(1, 1000, fechaInicio, fechaFin);
    }

    console.log("Datos para exportar:", response);

    const data = response?.incidents || response || [];

    if (data.length === 0) {
      await Swal.fire({
        title: 'Sin datos',
        text: 'No hay datos para exportar.',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (fmt === "csv") {
      exportToCSV(data, `incidentes_gallinas_${dateTag}.csv`);
    } else if (fmt === "excel") {
      exportToExcel(data, `incidentes_gallinas_${dateTag}.xlsx`);
    } else if (fmt === "pdf") {
      exportToPDF(data, `incidentes_gallinas_${dateTag}.pdf`);
    }
  } catch (error) {
    console.error("Error en exportación:", error);
    await Swal.fire({
      title: 'Error',
      text: 'Error al exportar los datos: ' + error.message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }
}

document.addEventListener("click", handleExportClick);

document.getElementById('createIncidenteGallinaModal').addEventListener('show.bs.modal', function () {
  cargarGalpones();
  cargarTiposIncidente();
});

document.getElementById('create-incidente-gallina-form').addEventListener('submit', handleCreateSubmit);

init(1, 10);

export { init };
