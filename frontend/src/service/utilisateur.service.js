import api from "./api.js";

const utilisateurService = {
    async getAll() {
        return await api.get("/users");
    },

    async getById(id) {
        return await api.get(`/users/${id}`);
    },

    async create(data) {
        return await api.post("/users", data);
    },

    async update(id, data) {
        return await api.put(`/users/${id}`, data);
    },

    async remove(id) {
        return await api.delete(`/users/${id}`);
    }
};

export default utilisateurService;
