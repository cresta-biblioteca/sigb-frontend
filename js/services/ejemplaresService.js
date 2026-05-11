import { api } from "./api.js";

const ejemplaresService = {
    getEjemplares(page = 1, limit = 10, estado = 'todos') {
        let url = `/ejemplares?page=${page}&per_page=${limit}`;
        if (estado && estado !== 'todos') {
            url += `&estado=${estado}`;
        }
        return api.get(url);
    },
    
    getEjemplarById(id) {
        return api.get(`/ejemplares/${id}`);
    },
    
    crearEjemplar(data) {
        return api.post(`/ejemplares`, data);
    },
    
    actualizarEjemplar(id, data) {
        return api.put(`/ejemplares/${id}`, data);
    },
    
    eliminarEjemplar(id) {
        return api.delete(`/ejemplares/${id}`);
    }
};

export { ejemplaresService };