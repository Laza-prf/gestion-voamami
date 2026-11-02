import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/penalites", { params });
    },
    getById(id) {
        return api.get(`/penalites/${id}`);
    },
    create(data) {
        return api.post("/penalites", data);
    },
    update(id, data) {
        return api.put(`/penalites/${id}`, data);
    }
};