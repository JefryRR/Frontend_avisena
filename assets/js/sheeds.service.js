import { request } from './apiClient.js';

export const shedsService = {
    /**
     * Obtener todos los galpones
     * @returns {Promise<object>}
     */
    getSheds: () => {
        const endpoint = `/sheds/all`;
        return request(endpoint);
    },
    
    /**
     * Obtener un galpón por su ID
     * @param {number} shedId - El ID del galpón a buscar
     * @returns {Promise<object>}
     */
    getShedById: (shedId) => {
        const endpoint = `/sheds/by-id/${shedId}`;
        return request(endpoint);
    },

    /**
     * Crear un galpón
     * @param {object} shedData - Los datos del nuevo galpón
     * @returns {Promise<object>}
     */
    createShed: (shedData) => {
        return request(`/sheds/crear-galpon`, {
            method: 'POST',
            body: JSON.stringify(shedData),
        });
    },

    /**
     * Actualizar un galpón
     * @param {string | number} shedId - El ID del galpón a actualizar
     * @param {object} shedData - Los nuevos datos del galpón
     * @returns {Promise<object>}
     */
    updateShed: (shedId, shedData) => {
        return request(`/sheds/by-id/${shedId}`, {
            method: 'PUT',
            body: JSON.stringify(shedData),
        });
    },

    /**
     * Cambiar estado de un galpón
     * @param {string | number} shedId - El ID del galpón
     * @param {boolean} newStatus - Nuevo estado
     * @returns {Promise<object>}
     */
    changeShedStatus: (shedId, newStatus) => {
        return request(`/sheds/cambiar-estado/${shedId}`, {
            method: 'PUT',
            body: JSON.stringify({ nuevo_estado: newStatus }),
        });
    }
};