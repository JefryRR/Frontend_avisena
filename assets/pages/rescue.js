import { rescueService } from '../js/rescue.service.js';
import { selectDataManager } from '../js/SelectDataManager.js';

let modalInstance = null;
let createModalInstance = null;

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalRescues = 0;
let fechaInicio = null;
let fechaFin = null;

// --- FUNCIONES PARA CERRAR MODALES CORRECTAMENTE ---

function setupModalCloseHandlers() {
    // Modal de edición
    const editModal = document.getElementById('editRescueModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', function () {
            document.getElementById('edit-rescue-form').reset();
        });
    }

    // Modal de creación
    const createModal = document.getElementById('createRescueModal');
    if (createModal) {
        createModal.addEventListener('hidden.bs.modal', function () {
            document.getElementById('create-rescue-form').reset();
        });
    }
}

// --- FUNCIÓN PARA CERRAR MODALES MANUALMENTE ---

function closeAllModals() {
    // Remover foco de cualquier elemento activo primero
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    });
    
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        backdrop.remove();
    });
    
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Forzar el foco al body después de cerrar
    document.body.focus();
}

function createRescueRow(rescue) {
    const rescueId = rescue.id_salvamento;

    return `
        <tr>
            <td class="px-0">
                <div class="d-flex align-items-center">
                    <div class="ms-3">
                        <h6 class="mb-0 fw-bolder">${rescue.nombre || `${rescue.id_galpon}`}</h6>
                        <span class="text-muted">ID: ${rescue.id_salvamento}</span>
                    </div>
                </div>
            </td>
            <td class="px-0">${rescue.fecha}</td>
            <td class="px-0">${rescue.raza || `${rescue.id_tipo_gallina}`}</td>
            <td class="px-0">${rescue.cantidad_gallinas} gallinas</td>
            <td class="px-0 text-end">
                <button class="btn btn-sm btn-info btn-edit-rescue" data-rescue-id="${rescueId}">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-delete-rescue" data-rescue-id="${rescueId}">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `;
}

// --- FUNCIONES PARA CARGAR SELECTS ---

function populateShedSelect(selectElement, selectedId = null) {
    const sheds = selectDataManager.getShedOptions();
    selectElement.innerHTML = '<option value="">Seleccionar Galpón</option>';
    
    sheds.forEach(shed => {
        const option = document.createElement('option');
        option.value = shed.value;
        option.textContent = shed.text;
        if (selectedId && shed.value === selectedId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

function populateChickenTypeSelect(selectElement, selectedId = null) {
    const chickenTypes = selectDataManager.getChickenTypeOptions();
    selectElement.innerHTML = '<option value="">Seleccionar Tipo de Gallina</option>';
    
    chickenTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.text;
        if (selectedId && type.value === selectedId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

// --- LÓGICA DE MODAL MEJORADA ---

async function openEditModal(rescueId) {
    console.log('Abriendo modal de edición para rescate:', rescueId);
    
    const modalElement = document.getElementById('editRescueModal');
    
    if (!modalElement) {
        console.error('No se encontró el modal de edición con id: editRescueModal');
        return;
    }

    try {
        // Cerrar modales existentes
        closeAllModals();
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Crear nueva instancia de modal
        modalInstance = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });

        const rescue = await rescueService.getRescueById(rescueId);
        
        // Llenar selects con datos reales
        const shedSelect = document.getElementById('edit-id_galpon');
        const chickenTypeSelect = document.getElementById('edit-id_tipo_gallina');
        
        if (shedSelect) populateShedSelect(shedSelect, rescue.id_galpon);
        if (chickenTypeSelect) populateChickenTypeSelect(chickenTypeSelect, rescue.id_tipo_gallina);
        
        // Llenar otros campos
        document.getElementById('edit-rescue-id').value = rescue.id_salvamento;
        document.getElementById('edit-fecha').value = rescue.fecha;
        document.getElementById('edit-cantidad_gallinas').value = rescue.cantidad_gallinas;
        
        // EVENTO PARA MANEJAR EL FOCO
        modalElement.addEventListener('shown.bs.modal', function () {
            // Forzar el foco al primer elemento del modal
            const firstInput = modalElement.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        });
        
        modalInstance.show();
        
    } catch (error) {
        console.error(`Error al obtener datos del rescate ${rescueId}:`, error);
        alert('No se pudieron cargar los datos del rescate.');
    }
}

function openCreateModal() {
    // Cerrar cualquier modal abierto primero
    closeAllModals();
    
    // Pequeño delay para asegurar que Bootstrap esté listo
    setTimeout(() => {
        const createModalElement = document.getElementById('createRescueModal');
        if (!createModalElement) {
            console.error('No se encontró el modal de creación');
            return;
        }

        // Crear nueva instancia de modal
        createModalInstance = new bootstrap.Modal(createModalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });

        // Llenar selects con datos reales
        const shedSelect = document.getElementById('create-id_galpon');
        const chickenTypeSelect = document.getElementById('create-id_tipo_gallina');
        
        if (shedSelect) populateShedSelect(shedSelect);
        if (chickenTypeSelect) populateChickenTypeSelect(chickenTypeSelect);
        
        // Establecer fecha actual por defecto
        document.getElementById('create-fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('create-cantidad_gallinas').value = '';
        
        createModalInstance.show();
    }, 50);
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
    event.preventDefault();
    const rescueId = document.getElementById('edit-rescue-id').value;
    const updatedData = {
        id_galpon: parseInt(document.getElementById('edit-id_galpon').value),
        fecha: document.getElementById('edit-fecha').value,
        id_tipo_gallina: parseInt(document.getElementById('edit-id_tipo_gallina').value),
        cantidad_gallinas: parseInt(document.getElementById('edit-cantidad_gallinas').value),
    };

    // Validación básica
    if (!updatedData.id_galpon || !updatedData.id_tipo_gallina || !updatedData.cantidad_gallinas) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        await rescueService.updateRescue(rescueId, updatedData);
        if (modalInstance) modalInstance.hide();
        await loadRescuesWithPagination();
        alert('Rescate actualizado exitosamente.');
    } catch (error) {
        console.error(`Error al actualizar el rescate ${rescueId}:`, error);
        alert('No se pudo actualizar el rescate: ' + error.message);
    }
}

async function handleTableClick(event) {
    const editButton = event.target.closest('.btn-edit-rescue');
    if (editButton) {
        const rescueId = editButton.dataset.rescueId;
        openEditModal(rescueId);
        return;
    }

    const deleteButton = event.target.closest('.btn-delete-rescue');
    if (deleteButton) {
        const rescueId = deleteButton.dataset.rescueId;
        await handleDeleteRescue(rescueId);
        return;
    }
}

async function handleDeleteRescue(rescueId) {
    if (confirm('¿Estás seguro de que deseas eliminar este rescate?')) {
        try {
            await rescueService.deleteRescue(rescueId);
            alert('Rescate eliminado exitosamente.');
            await loadRescuesWithPagination();
        } catch (error) {
            console.error(`Error al eliminar el rescate ${rescueId}:`, error);
            alert('No se pudo eliminar el rescate.');
        }
    }
}

async function handleCreateSubmit(event) {
    event.preventDefault();

    const newRescueData = {
        id_galpon: parseInt(document.getElementById('create-id_galpon').value),
        fecha: document.getElementById('create-fecha').value,
        id_tipo_gallina: parseInt(document.getElementById('create-id_tipo_gallina').value),
        cantidad_gallinas: parseInt(document.getElementById('create-cantidad_gallinas').value),
    };

    // Validación básica
    if (!newRescueData.id_galpon || !newRescueData.id_tipo_gallina || !newRescueData.cantidad_gallinas) {
        alert('Por favor complete todos los campos obligatorios');
        return;
    }

    try {
        await rescueService.createRescue(newRescueData);
        
        if (createModalInstance) {
            createModalInstance.hide();
        }
        
        document.getElementById('create-rescue-form').reset();
        alert('Rescate creado exitosamente.');
        await loadRescuesWithPagination();
    } catch (error) {
        console.error('Error al crear el rescate:', error);
        alert('No se pudo crear el rescate: ' + error.message);
    }
}

// --- CONFIGURAR BOTONES DE CANCELAR ---

function setupCancelButtons() {
    // Botones de cancelar en modales
    const cancelButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    });
}

// --- FUNCIONES DE PAGINACIÓN ---

function setupPaginationEventListeners() {
    // Select de tamaño de página
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSize = parseInt(this.value);
            currentPage = 1;
            loadRescuesWithPagination();
        });
    }

    // Botón de filtrar
    const btnFiltrar = document.getElementById('btn-filtrar');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            fechaInicio = document.getElementById('fecha-inicio').value;
            fechaFin = document.getElementById('fecha-fin').value;
            
            // Validar fechas
            if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
                alert('La fecha de inicio no puede ser mayor que la fecha de fin');
                return;
            }
            
            currentPage = 1;
            loadRescuesWithPagination();
        });
    }

    // Botón de limpiar
    const btnLimpiar = document.getElementById('btn-limpiar');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', function() {
            document.getElementById('fecha-inicio').value = '';
            document.getElementById('fecha-fin').value = '';
            fechaInicio = null;
            fechaFin = null;
            currentPage = 1;
            loadRescuesWithPagination();
        });
    }
}

function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;

    paginationElement.innerHTML = '';

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    paginationElement.appendChild(prevLi);

    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        `;
        paginationElement.appendChild(pageLi);
    }

    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    paginationElement.appendChild(nextLi);

    // Event listeners para los botones de paginación
    paginationElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                currentPage = page;
                loadRescuesWithPagination();
            }
        });
    });
}

async function loadRescuesWithPagination() {
    const tableBody = document.getElementById('rescue-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando rescates...</td></tr>';

    try {
        let response;
        
        if (fechaInicio && fechaFin) {
            // Usar endpoint con filtro de fechas
            response = await fetchWithDates(currentPage, pageSize);
        } else {
            // Usar endpoint normal
            response = await fetchWithoutDates(currentPage, pageSize);
        }

        console.log('Respuesta de paginación:', response);

        if (response && response.rescues && response.rescues.length > 0) {
            tableBody.innerHTML = response.rescues.map(createRescueRow).join('');
            totalPages = response.total_pages;
            totalRescues = response.total_rescues;
            
            // Actualizar información de paginación
            updatePaginationInfo();
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron rescates.</td></tr>';
            totalPages = 1;
            totalRescues = 0;
            updatePaginationInfo();
        }

        renderPagination();

    } catch (error) {
        console.error('Error al cargar rescates con paginación:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos.</td></tr>';
    }
}

async function fetchWithDates(page, size) {
    const endpoint = `/rescue/all-pag-by-date?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}&page=${page}&page_size=${size}`;
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`https://avisena-yzq3.onrender.com${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Error en la petición');
    }
    
    return await response.json();
}

async function fetchWithoutDates(page, size) {
    const endpoint = `/rescue/all-pag?page=${page}&page_size=${size}`;
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`https://avisena-yzq3.onrender.com${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Error en la petición');
    }
    
    return await response.json();
}

function updatePaginationInfo() {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) {
        // Crear elemento si no existe
        const paginationContainer = document.querySelector('.pagination').parentElement;
        const infoDiv = document.createElement('div');
        infoDiv.id = 'pagination-info';
        infoDiv.className = 'text-center text-muted mt-2';
        paginationContainer.appendChild(infoDiv);
    }
    
    const finalInfoElement = document.getElementById('pagination-info');
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalRescues);
    finalInfoElement.textContent = `Mostrando ${startItem}-${endItem} de ${totalRescues} registros`;
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

async function init() {
    // Cargar datos para los selects primero
    if (!selectDataManager.isLoaded) {
        try {
            await selectDataManager.loadData();
        } catch (error) {
            console.error('Error cargando datos para selects:', error);
            alert('Error cargando datos de galpones y tipos de gallina');
        }
    }

    // Configurar event listeners de paginación
    setupPaginationEventListeners();

    // Cargar datos con paginación
    await loadRescuesWithPagination();

    // Configurar event listeners existentes
    const tableBody = document.getElementById('rescue-table-body');
    const editForm = document.getElementById('edit-rescue-form');
    const createForm = document.getElementById('create-rescue-form');
    const createButton = document.querySelector('[data-bs-target="#createRescueModal"]');
    
    if (tableBody) {
        tableBody.removeEventListener('click', handleTableClick);
        tableBody.addEventListener('click', handleTableClick);
    }
    
    if (editForm) {
        editForm.removeEventListener('submit', handleUpdateSubmit);
        editForm.addEventListener('submit', handleUpdateSubmit);
    }
    
    if (createForm) {
        createForm.removeEventListener('submit', handleCreateSubmit);
        createForm.addEventListener('submit', handleCreateSubmit);
    }

    if (createButton) {
        createButton.removeEventListener('click', openCreateModal);
        createButton.addEventListener('click', openCreateModal);
    }

    // Configurar handlers para cerrar modales
    setupModalCloseHandlers();
    setupCancelButtons();
}

export { init };
