
import { request } from './apiClient.js';

export const userService = {
    getUsers: () => {
        const userString = localStorage.getItem('user');
        if (!userString) {
            return Promise.reject(new Error('Información de usuario no encontrada.'));
        }
        const user = JSON.parse(userString);

        // if(user.id_rol !=1){
        //     if(user.id_rol !=2){
        //         alert("No tiene permisos");
        //     };
        // };
        const endpoint = `/users/all_except_admins`;
        
        // La lógica es mucho más simple ahora, solo llamamos a nuestro cliente central.
        return request(endpoint);
    },
    
    /**
     * Obtener un usuario por su ID.
     * @param {string} correo - El correo del usuario a buscar.
     * @returns {Promise<object>}
    */
    getUserByEmail: (correo) => {
        // Construimos la URL con el parámetro ?id_usuario=
        const endpoint = `/users/by-email?email=${correo}`;
        return request(endpoint);
    },

    /**
     * Actualizar un usuario.
     * @param {string | number} userId - El ID del usuario a actualizar.
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
    */
    updateUser: (userId, userData) => {
        return request(`/users/by_id/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
        });
    },

    // Desactivar / Activar un usuario
    /**
     * Modifica el estado de un usuario (generalmente para desactivarlo).
     * @param {string | number} userId - El ID del usuario a modificar.
     * @returns {Promise<object>}
     */
    changeStatusUser: (userId, newStatus) => {
        // Nuestro apiClient se encargará de añadir el token de autorización.
    return request(`/users/cambiar-estado/${userId}?nuevo_estado=${newStatus}`, {
        method: 'PUT',
        });
    },

    /**
     * Crear un usuario.
     * @param {object} userData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
    */
    createUser: (userData) => {
        return request(`/users/crear`, {
        method: 'POST',
        body: JSON.stringify(userData),
        });
    },

    // Aquí podrías añadir más servicios
};