// Este servicio NO usará nuestro apiClient 'request' porque el login es especial (x-www-form-urlencoded)
// y no necesita token.

export const authService = {
    logout: () => {
        console.log('Cerrando sesión...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },
};