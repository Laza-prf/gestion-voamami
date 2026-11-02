import api from "./api.js";

export default {
    getAll(params = {}) {
        return api.get("/epargnes", { params });
    },
    getById(id) {
        return api.get(`/epargnes/${id}`);
    },
    create(data) {
        return api.post("/epargnes", data);
    },
    createMany(data) {
        return api.post("/epargnes", data);
    },
    remove(id) {
        return api.delete(`/epargnes/${id}`);
    }
};