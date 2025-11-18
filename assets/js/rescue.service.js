import { request } from './apiClient.js';
// Quita esta línea: import { selectDataManager } from './SelectDataManager.js';

export const rescueService = {
    /**
     * Obtener todos los rescates
     * @returns {Promise<object>}
     */
    getRescues: () => {
        const endpoint = `/rescue/all`;
        return request(endpoint);
    },
    
    /**
     * Obtener un rescate por su ID
     * @param {number} rescueId - El ID del rescate a buscar
     * @returns {Promise<object>}
     */
    getRescueById: (rescueId) => {
        const endpoint = `/rescue/by-id/${rescueId}`;
        return request(endpoint);
    },

    /**
     * Actualizar un rescate
     * @param {string | number} rescueId - El ID del rescate a actualizar
     * @param {object} rescueData - Los nuevos datos del rescate
     * @returns {Promise<object>}
     */
    updateRescue: (rescueId, rescueData) => {
        return request(`/rescue/by-id/${rescueId}`, {
            method: 'PUT',
            body: JSON.stringify(rescueData),
        });
    },

    /**
     * Crear un rescate
     * @param {object} rescueData - Los datos del nuevo rescate
     * @returns {Promise<object>}
     */
    createRescue: (rescueData) => {
        return request(`/rescue/crear`, {
            method: 'POST',
            body: JSON.stringify(rescueData),
        });
    },

    /**
     * Eliminar un rescate
     * @param {string | number} rescueId - El ID del rescate a eliminar
     * @returns {Promise<object>}
     */
    deleteRescue: (rescueId) => {
        return request(`/rescue/by-id-delete/${rescueId}`, {
            method: 'DELETE',
        });
    }
};