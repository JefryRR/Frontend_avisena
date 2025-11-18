import { request } from './apiClient.js';

export const typeChickensService = {
    /**
     * Obtener todos los tipos de gallina
     * @returns {Promise<object>}
     */
    getChickenTypes: () => {
        const endpoint = `/type_chicken/all-type-chickens`;  // ← QUITAR la "s" de type_chickenS
        return request(endpoint);
    },
    
    /**
     * Obtener un tipo de gallina por su ID
     * @param {number} typeId - El ID del tipo de gallina a buscar
     * @returns {Promise<object>}
     */
    getChickenTypeById: (typeId) => {
        const endpoint = `/type_chicken/by-id?id=${typeId}`;  // ← QUITAR la "s" aquí también
        return request(endpoint);
    },

    /**
     * Crear un tipo de gallina
     * @param {object} typeData - Los datos del nuevo tipo de gallina
     * @returns {Promise<object>}
     */
    createChickenType: (typeData) => {
        return request(`/type_chicken/crear`, {  // ← QUITAR la "s" aquí también
            method: 'POST',
            body: JSON.stringify(typeData),
        });
    },

    /**
     * Actualizar un tipo de gallina
     * @param {string | number} typeId - El ID del tipo de gallina a actualizar
     * @param {object} typeData - Los nuevos datos del tipo de gallina
     * @returns {Promise<object>}
     */
    updateChickenType: (typeId, typeData) => {
        return request(`/type_chicken/by-id/${typeId}`, {  // ← QUITAR la "s" aquí también
            method: 'PUT',
            body: JSON.stringify(typeData),
        });
    }
};