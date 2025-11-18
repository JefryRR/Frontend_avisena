import { typeChickenService } from '../js/tipos_gallinas.service.js';

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null;

function createTypeChickenRow(typeChicken) {
  return `
    <tr>
      <td class="px-0 text-center">${typeChicken.id_tipo_gallinas}</td>
      <td class="px-0 text-center">${typeChicken.raza}</td>
      <td class="px-0 text-center">${typeChicken.descripcion}</td>
      <td class="px-0 text-center text-end">
          <button class="btn btn-sm btn-success btn-edit-tipo-gallina" data-tipo-gallina-id="${typeChicken.id_tipo_gallinas}"><i class="fa-regular fa-pen-to-square"></i></button>
      </td>
    </tr>
  `;
}

// --- LÓGICA DE MODAL ---

async function openEditModal(id) {
  const modalElement = document.getElementById('edit-tipo-gallina-modal');
  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }
  try {
    const typeChicken = await typeChickenService.getTypeChickenById(id);
    document.getElementById('edit-tipo-gallina-id').value = typeChicken.id_tipo_gallinas;
    document.getElementById('edit-raza').value = typeChicken.raza;
    document.getElementById('edit-descripcion').value = typeChicken.descripcion;
    modalInstance.show();
  } catch (error) {
    console.error(`Error al obtener datos del tipo de gallina ${id}:`, error);
    alert('No se pudieron cargar los datos del tipo de gallina.');
  }
}

// --- MANEJADORES DE EVENTOS ---

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const typeChickenId = document.getElementById('edit-tipo-gallina-id').value;
  const updatedData = {
    raza: document.getElementById('edit-raza').value,
    descripcion: document.getElementById('edit-descripcion').value
  };

  try {
    await typeChickenService.updateTypeChicken(typeChickenId, updatedData);
    modalInstance.hide();
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error(`Error al actualizar el tipo de gallina ${typeChickenId}:`, error);
    alert('No se pudo actualizar el tipo de gallina.');
  }
}

async function handleTableClick(event) {
    // Manejador para el botón de editar
  const editButton = event.target.closest('.btn-edit-tipo-gallina');
  if (editButton) {
    const id = editButton.dataset.tipoGallinaId;
    console.log(`Edit type chiken with id: ${id}`);
    openEditModal(id);
    return;
  }
}
  

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---

// manejador de formulario crear tipos
async function handleCreateSubmit(event) {
  event.preventDefault();

  const newtypeChikenData = {
    raza: document.getElementById('create-raza').value,
    descripcion: document.getElementById('create-descripcion').value
  };

  try {
    await typeChickenService.createTypeChicken(newtypeChikenData);
    if(createModalInstance) createModalInstance.hide();
    document.getElementById('create-tipo-gallina-form').reset(); // Limpiamos el formulario
    alert('Tipo de gallina creado exitosamente.');
    init(); // Recargamos la tabla para ver el nuevo tipo
  } catch (error) {
    console.error('Error al crear tipo de gallina:', error);
    alert('No se pudo crear tipo de gallina.');
  }
}

async function init() {
  const tableBody = document.getElementById('tipo-gallina-table-body');
  if (!tableBody) return;

    if (!createModalInstance) {
        const createModalElement = document.getElementById('create-tipo-gallina-modal');
        createModalInstance = new bootstrap.Modal(createModalElement);
    }

  tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Cargando tipos de gallinas ... </td></tr>'; // ✅ CORRECCIÓN: colspan="4"

  try {
    const typeChicken = await typeChickenService.getTypeChicken();
    if (typeChicken && typeChicken.length > 0) {
      tableBody.innerHTML = typeChicken.map(createTypeChickenRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No se encontraron tipos de gallinas.</td></tr>'; // ✅ CORRECCIÓN: colspan="4"
    }
  } catch (error) {
    console.error('Error al obtener los tipos de gallinas:', error);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error al cargar los datos.</td></tr>`; // ✅ CORRECCIÓN: colspan="4"
  }

  // Aplicamos el patrón remove/add para evitar listeners duplicados
  const editForm = document.getElementById('edit-tipo-gallina-form');
  const createForm = document.getElementById('create-tipo-gallina-form');
  tableBody.removeEventListener('click', handleTableClick);
  tableBody.addEventListener('click', handleTableClick);
  editForm.removeEventListener('submit', handleUpdateSubmit);
  editForm.addEventListener('submit', handleUpdateSubmit);
  createForm.removeEventListener('submit', handleCreateSubmit);
  createForm.addEventListener('submit', handleCreateSubmit);

}

export { init };
