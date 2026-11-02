import api from "./api.js";

const membreService = {
    getAll() {
        return api.get("/membres");
    },

    getById(id) {
        return api.get(`/membres/${id}`);
    },

    create(data) {
        return api.post("/membres", data);
    },

    update(id, data) {
        return api.put(`/membres/${id}`, data);
    },

    remove(id) {
        return api.delete(`/membres/${id}`);
    }
};

export default membreService;
