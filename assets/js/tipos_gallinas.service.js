
import { request } from './apiClient.js';

export const typeChickenService = {
    getTypeChicken: () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            return Promise.reject(new Error('Información de usuario no encontrada.'));
        }
        const user = JSON.parse(userString);
        
        const endpoint = `/type_chicken/all-type-chickens`;
        
        // La lógica es mucho más simple ahora, solo llamamos a nuestro cliente central.
        return request(endpoint);
    },

    getTypeChickenById: (id) => {
        return request(`/type_chicken/by-id?id=${id}`);
    },

    
    /**
     * Actualizar un tipo. - El ID del tipo a actualizar.
     * @param {object} typeChickenData - Los nuevos datos del tipo.
     * @returns {Promise<object>}
    */
    updateTypeChicken: (id, typeChickenData) => {
        return request(`/type_chicken/by-id/${id}`, {
        method: 'PUT',
        body: JSON.stringify(typeChickenData),
        });
    },

    /**
     * Crear un tipo.
     * @param {object} typeChickenData - Los nuevos datos del tipo.
     * @returns {Promise<object>}
    */
    createTypeChicken: (typeChickenData) => {
        return request(`/type_chicken/crear`, {
        method: 'POST',
        body: JSON.stringify(typeChickenData),
        });
    },

    // Aquí podrías añadir más servicios
};